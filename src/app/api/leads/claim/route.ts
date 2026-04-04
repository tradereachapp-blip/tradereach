import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { PRO_MONTHLY_LEAD_CAP } from '@/lib/config'
import { PRICING } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { lead_id } = body
    if (!lead_id) return structuredError('lead_id required', 400)

    const admin = createAdminClient()

    // Get contractor (always from DB — never trust client)
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor profile not found', 404)

    // Verify contractor has an active plan
    const canAct = contractor.plan_type !== 'none' &&
      (contractor.plan_type === 'pay_per_lead' ||
        ['active', 'trialing'].includes(contractor.subscription_status))
    if (!canAct) return structuredError('Your subscription is not active', 403)

    // Get lead
    const { data: lead } = await admin
      .from('leads').select('*').eq('id', lead_id).single()
    if (!lead) return structuredError('Lead not found', 404)
    if (lead.status !== 'available') {
      return Response.json({ success: false, error: 'This lead has already been claimed.', status: 'gone' }, { status: 409 })
    }

    // Verify niche and zip match
    if (lead.niche !== contractor.niche) return structuredError('Lead niche does not match your specialty', 403)
    if (!contractor.zip_codes.includes(lead.zip)) return structuredError('Lead ZIP is not in your service area', 403)

    // Determine claim path
    if (contractor.plan_type === 'elite') {
      // Elite: free claim
      await claimLeadFree(admin, lead_id, contractor.id, false)
      return Response.json({ success: true, claim_type: 'subscription', message: 'Lead claimed!' })
    }

    if (contractor.plan_type === 'pro') {
      if (contractor.leads_used_this_month < PRO_MONTHLY_LEAD_CAP) {
        // Under cap: free claim
        await claimLeadFree(admin, lead_id, contractor.id, true)
        return Response.json({ success: true, claim_type: 'subscription', message: 'Lead claimed!' })
      } else {
        // Over cap: needs payment
        return Response.json({
          success: false,
          claim_type: 'overage',
          requires_payment: true,
          amount: PRICING.PRO_OVERAGE,
          message: `You've used all ${PRO_MONTHLY_LEAD_CAP} included leads this month. Claim this lead for $${PRICING.PRO_OVERAGE}?`,
        })
      }
    }

    if (contractor.plan_type === 'pay_per_lead') {
      // Needs payment
      return Response.json({
        success: false,
        claim_type: 'pay_per_lead',
        requires_payment: true,
        amount: 45,
        message: 'Claim this lead for $45?',
      })
    }

    return structuredError('Unknown plan type', 400)
  } catch (err) {
    await logError('lead_claim_error', safeErrorMessage(err))
    return structuredError('Failed to process claim', 500)
  }
}

async function claimLeadFree(
  admin: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>,
  leadId: string,
  contractorId: string,
  incrementCount: boolean
) {
  // Atomic update — only update if still available
  const { data: updated, error } = await admin
    .from('leads')
    .update({
      status: 'claimed',
      claimed_by: contractorId,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('status', 'available')
    .select()

  if (error || !updated || updated.length === 0) {
    throw new Error('Lead was already claimed by another contractor')
  }

  // Record in lead_claims
  await admin.from('lead_claims').insert({
    lead_id: leadId,
    contractor_id: contractorId,
    payment_type: 'subscription',
    amount_charged: 0,
  })

  // Increment monthly count for Pro — single direct read+write
  if (incrementCount) {
    const { data: c } = await admin
      .from('contractors')
      .select('leads_used_this_month')
      .eq('id', contractorId)
      .single()
    if (c) {
      await admin.from('contractors').update({
        leads_used_this_month: c.leads_used_this_month + 1,
      }).eq('id', contractorId)
    }
  }
}
