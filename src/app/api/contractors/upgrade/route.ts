import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { getZipStatus } from '@/lib/utils/zip-status'
import { recordZipClaim } from '@/lib/utils/zip-claims'
import { getMonthlyCredits, getRolloverMax } from '@/lib/pricing'
import { PLAN_CONFIG } from '@/lib/config'
import type { PlanType, Niche, ZipClaimType } from '@/types'
import { stripe } from '@/lib/stripe/client'
import { sendUpgradeConfirmationEmail, sendZipTerritoryChangeNotification } from '@/lib/resend/templates'

// GET /api/contractors/upgrade?targetPlan=elite — preview what will change
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const url = new URL(request.url)
    const targetPlan = url.searchParams.get('targetPlan') as PlanType
    if (!targetPlan) return structuredError('targetPlan required', 400)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    const currentCredits = contractor.lead_credits_remaining ?? 0
    const newRolloverMax = getRolloverMax(targetPlan)
    const creditsAfterUpgrade = Math.min(currentCredits, newRolloverMax)

    // Preview ZIP changes
    const zipBreakdown = []
    for (const zip of (contractor.zip_codes ?? [])) {
      const currentStatus = await getZipStatus(zip, contractor.niche, contractor.id, contractor.plan_type)
      const futureStatus = await getZipStatus(zip, contractor.niche, contractor.id, targetPlan)
      zipBreakdown.push({
        zip,
        current_claim: currentStatus.claimType,
        future_claim: futureStatus.claimType,
        current_badge: currentStatus.badge,
        future_badge: futureStatus.badge,
        description: futureStatus.description,
        improving: futureStatus.claimType !== currentStatus.claimType,
      })
    }

    const planConfig = PLAN_CONFIG[targetPlan]

    return Response.json({
      current_plan: contractor.plan_type,
      target_plan: targetPlan,
      current_credits: currentCredits,
      credits_after_upgrade: creditsAfterUpgrade,
      credits_lost: currentCredits - creditsAfterUpgrade,
      new_monthly_credits: getMonthlyCredits(targetPlan),
      new_rollover_max: newRolloverMax,
      zip_breakdown: zipBreakdown,
      has_account_manager: planConfig?.hasAccountManager ?? false,
      has_monthly_review: planConfig?.hasMonthlyReview ?? false,
      new_price: planConfig?.price,
    })
  } catch (err) {
    await logError('upgrade_preview_error', safeErrorMessage(err))
    return structuredError('Failed to preview upgrade', 500)
  }
}

// POST /api/contractors/upgrade — execute upgrade
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { targetPlan, interval, isFoundingMember, confirmed } = body

    if (!targetPlan) return structuredError('targetPlan required', 400)
    if (!confirmed) return Response.json({ success: false, requires_confirmation: true })

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    // Credit conversion: never lose credits on upgrade
    const currentCredits = contractor.lead_credits_remaining ?? 0
    const newRolloverMax = getRolloverMax(targetPlan)
    const newCredits = Math.min(currentCredits, newRolloverMax)
    const creditsLost = currentCredits - newCredits

    // Update contractor plan
    await admin.from('contractors').update({
      plan_type: targetPlan,
      plan_interval: interval ?? contractor.plan_interval ?? 'monthly',
      lead_credits_remaining: newCredits,
    }).eq('id', contractor.id)

    // Log credit adjustment if any lost
    if (creditsLost > 0) {
      await admin.from('credit_transactions').insert({
        contractor_id: contractor.id,
        transaction_type: 'upgrade_conversion',
        amount: -creditsLost,
        balance_after: newCredits,
        description: `Credits reduced on plan change: ${contractor.plan_type} → ${targetPlan}. ${creditsLost} credits above new rollover max (${newRolloverMax}) removed.`,
      })
    } else if (currentCredits > 0) {
      await admin.from('credit_transactions').insert({
        contractor_id: contractor.id,
        transaction_type: 'upgrade_conversion',
        amount: 0,
        balance_after: newCredits,
        description: `Credits preserved on upgrade: ${contractor.plan_type} → ${targetPlan}. ${currentCredits} credits carried forward.`,
      })
    }

    // Update ZIP claims for each ZIP
    for (const zip of (contractor.zip_codes ?? [])) {
      const newStatus = await getZipStatus(zip, contractor.niche, contractor.id, targetPlan)
      if (newStatus.claimType) {
        await recordZipClaim(contractor.id, zip, contractor.niche, newStatus.claimType, targetPlan)
      }
    }

    // Assign account manager for Elite Plus
    if (targetPlan === 'elite_plus') {
      await assignAccountManager(contractor.id, admin)
    }

    // Send upgrade confirmation email
    const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
    const email = userData?.user?.email
    if (email) {
      await sendUpgradeConfirmationEmail(email, contractor, targetPlan, newCredits)
    }

    return Response.json({
      success: true,
      new_plan: targetPlan,
      credits_after: newCredits,
      message: `Successfully upgraded to ${targetPlan}`,
    })
  } catch (err) {
    await logError('upgrade_execute_error', safeErrorMessage(err))
    return structuredError('Failed to execute upgrade', 500)
  }
}

async function assignAccountManager(contractorId: string, admin: ReturnType<typeof createAdminClient>) {
  // Find account manager with fewest current Elite Plus accounts (round-robin)
  const { data: managers } = await admin
    .from('team_members')
    .select('id, user_id')
    .eq('role', 'account_manager')
    .eq('status', 'active')

  if (!managers || managers.length === 0) return

  // Count assignments per manager
  const { data: assignments } = await admin
    .from('account_manager_assignments')
    .select('account_manager_id')
    .eq('is_active', true)

  const counts: Record<string, number> = {}
  managers.forEach(m => { counts[m.id] = 0 })
  ;(assignments ?? []).forEach(a => {
    if (counts[a.account_manager_id] !== undefined) {
      counts[a.account_manager_id]++
    }
  })

  const leastBusyManager = managers.reduce((a, b) => (counts[a.id] ?? 0) <= (counts[b.id] ?? 0) ? a : b)

  await admin.from('account_manager_assignments').upsert({
    contractor_id: contractorId,
    account_manager_id: leastBusyManager.id,
    assigned_at: new Date().toISOString(),
    is_active: true,
  }, { onConflict: 'contractor_id' })

  await admin.from('contractors').update({
    account_manager_id: leastBusyManager.id,
  }).eq('id', contractorId)
}
