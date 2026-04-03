import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createLeadPaymentIntent } from '@/lib/stripe/checkout'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'
import { PAY_PER_LEAD_PRICE_CENTS, PRO_OVERAGE_PRICE_CENTS, PRO_MONTHLY_LEAD_CAP } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { lead_id } = body
    if (!lead_id) return structuredError('lead_id required', 400)

    const admin = createAdminClient()

    // Get contractor
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    // Verify lead exists and is available
    const { data: lead } = await admin
      .from('leads').select('*').eq('id', lead_id).single()
    if (!lead) return structuredError('Lead not found', 404)
    if (lead.status !== 'available') return structuredError('Lead is no longer available', 409)

    // Determine charge amount
    let amountCents: number
    let description: string

    if (contractor.plan_type === 'pay_per_lead') {
      amountCents = PAY_PER_LEAD_PRICE_CENTS
      description = `TradeReach Pay-Per-Lead: ${lead.niche} in ${lead.zip}`
    } else if (contractor.plan_type === 'pro') {
      // Must be over cap to reach here
      if (contractor.leads_used_this_month < PRO_MONTHLY_LEAD_CAP) {
        return structuredError('Use subscription claim endpoint instead', 400)
      }
      amountCents = PRO_OVERAGE_PRICE_CENTS
      description = `TradeReach Pro Overage Lead: ${lead.niche} in ${lead.zip}`
    } else {
      return structuredError('Invalid plan for payment intent', 400)
    }

    const intent = await createLeadPaymentIntent({
      amountCents,
      contractorId: contractor.id,
      leadId: lead_id,
      stripeCustomerId: contractor.stripe_customer_id,
      description,
    })

    return Response.json({
      client_secret: intent.client_secret,
      payment_intent_id: intent.id,
      amount: amountCents,
    })
  } catch (err) {
    await logError('payment_intent_create', safeErrorMessage(err))
    return structuredError('Failed to create payment intent', 500)
  }
}
