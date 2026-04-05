import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, structuredError } from '@/lib/utils/error-logger'
import { sendMonthlyCreditsGrantedEmail } from '@/lib/resend/templates'
import { getMonthlyCredits, getRolloverMax } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

// Cron: 1st of each month at midnight UTC
// Grant monthly credits and process rollover

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return structuredError('Unauthorized', 401)
  }

  try {
    const admin = createAdminClient()

    // Get all active Pro/Elite/Elite Plus contractors
    const { data: contractors } = await admin
      .from('contractors')
      .select('id, user_id, plan_type, lead_credits_remaining, subscription_status')
      .in('plan_type', ['pro', 'elite', 'elite_plus'])
      .eq('subscription_status', 'active')

    let processed = 0
    let errors = 0
    let totalGranted = 0

    for (const contractor of (contractors ?? [])) {
      try {
        // Skip if paused
        const { data: c } = await admin
          .from('contractors')
          .select('pause_subscription_until')
          .eq('id', contractor.id)
          .single()

        if (c?.pause_subscription_until && new Date(c.pause_subscription_until) > new Date()) {
          continue
        }

        const monthlyGrant = getMonthlyCredits(contractor.plan_type)
        const rolloverMax = getRolloverMax(contractor.plan_type)
        const currentCredits = contractor.lead_credits_remaining ?? 0

        // Apply rollover cap: new balance = min(current + monthly, max)
        const newBalance = Math.min(currentCredits + monthlyGrant, rolloverMax)
        const actualGrant = newBalance - currentCredits

        // Update contractor
        await admin
          .from('contractors')
          .update({ lead_credits_remaining: newBalance })
          .eq('id', contractor.id)

        // Log transaction
        await admin.from('credit_transactions').insert({
          contractor_id: contractor.id,
          transaction_type: 'monthly_grant',
          amount: actualGrant,
          balance_after: newBalance,
          description: `Monthly grant: +${monthlyGrant} credits. Rollover cap (${rolloverMax}) applied. New balance: ${newBalance}.`,
        })

        // If credits were capped, log rollover separately
        if (currentCredits > 0 && currentCredits + monthlyGrant > rolloverMax) {
          const rolloverAmount = currentCredits + monthlyGrant - rolloverMax
          await admin.from('credit_transactions').insert({
            contractor_id: contractor.id,
            transaction_type: 'rollover_cap',
            amount: -rolloverAmount,
            balance_after: newBalance,
            description: `Rollover capped: ${rolloverAmount} credits exceeded max of ${rolloverMax}.`,
          })
        }

        // Send email
        const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
        const email = userData?.user?.email
        if (email) {
          await sendMonthlyCreditsGrantedEmail(email, contractor, actualGrant, newBalance, rolloverMax)
        }

        totalGranted += actualGrant
        processed++
      } catch (err) {
        errors++
        await logError('monthly_credits_cron_error', `Contractor ${contractor.id}: ${String(err)}`)
      }
    }

    return Response.json({
      success: true,
      contractors_processed: processed,
      errors,
      total_credits_granted: totalGranted,
      message: `Monthly credits processed for ${processed} contractors (${totalGranted} total credits granted)`,
    })
  } catch (err) {
    await logError('monthly_credits_cron_fatal', String(err))
    return structuredError('Cron job failed', 500)
  }
}
