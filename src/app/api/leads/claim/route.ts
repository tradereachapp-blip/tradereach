import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { getMonthlyCredits, getOveragePrice } from '@/lib/pricing'
import { notifyContractors } from '@/lib/utils/notify-contractors'
import { stripe } from '@/lib/stripe/client'

// POST /api/leads/claim
// Contractor claims a lead
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { lead_id, confirmed_overage } = body
    if (!lead_id) return structuredError('lead_id required', 400)

    const admin = createAdminClient()

    // Get lead and contractor
    const [{ data: lead }, { data: contractor }] = await Promise.all([
      admin.from('leads').select('*').eq('id', lead_id).single(),
      admin.from('contractors').select('*').eq('user_id', user.id).single(),
    ])

    if (!lead) return structuredError('Lead not found', 404)
    if (!contractor) return structuredError('Contractor not found', 404)

    // Check if already claimed
    if (lead.status !== 'available') {
      return Response.json({ success: false, error: 'Lead already claimed' }, { status: 400 })
    }

    // Check if paused
    if (contractor.subscription_status === 'paused') {
      return Response.json(
        { success: false, error: `Your subscription is paused until ${new Date(contractor.pause_subscription_until).toLocaleDateString()}` },
        { status: 403 }
      )
    }

    // Handle PPL claims
    if (contractor.plan_type === 'pay_per_lead') {
      const pplPrice = 45
      const paymentIntentId = await createPaymentIntent(contractor.id, lead_id, pplPrice, 'pay_per_lead')
      return Response.json({
        success: false,
        requires_payment: true,
        amount: pplPrice,
        payment_intent_id: paymentIntentId,
        message: `Lead requires $${pplPrice} payment to claim`,
      })
    }

    // Handle credit-based claims
    const credits = contractor.lead_credits_remaining ?? 0

    if (credits > 0) {
      // Free claim with credit deduction
      const result = await admin
        .from('leads')
        .update({ status: 'claimed', claimed_by_contractor_id: contractor.id, claimed_at: new Date().toISOString() })
        .eq('id', lead_id)
        .eq('status', 'available') // Atomic guard
        .select()
        .single()

      if (!result.data) {
        return Response.json({ success: false, error: 'Lead no longer available' }, { status: 409 })
      }

      // Decrement credits
      const newBalance = credits - 1
      await admin
        .from('contractors')
        .update({ lead_credits_remaining: newBalance })
        .eq('id', contractor.id)

      // Log transaction
      await admin.from('credit_transactions').insert({
        contractor_id: contractor.id,
        transaction_type: 'lead_claim',
        amount: -1,
        balance_after: newBalance,
        lead_id,
      })

      return Response.json({
        success: true,
        lead: result.data,
        credits_remaining: newBalance,
        message: 'Lead claimed using credit',
      })
    }

    // Credits exhausted: show overage modal or charge
    const overagePrice = getOveragePrice(contractor.plan_type)

    if (!confirmed_overage) {
      return Response.json({
        success: false,
        requires_payment: true,
        is_overage: true,
        amount: overagePrice,
        message: `You have no credits remaining. Claiming this lead will charge $${overagePrice}`,
      })
    }

    // Confirmed overage: create payment intent
    const paymentIntentId = await createPaymentIntent(contractor.id, lead_id, overagePrice, 'overage')

    return Response.json({
      success: false,
      requires_payment: true,
      payment_intent_id: paymentIntentId,
      amount: overagePrice,
      message: `Payment intent created for $${overagePrice}`,
    })
  } catch (err) {
    await logError('lead_claim_error', safeErrorMessage(err))
    return structuredError('Failed to claim lead', 500)
  }
}

async function createPaymentIntent(contractorId: string, leadId: string, amount: number, type: string) {
  const admin = createAdminClient()
  const { data: contractor } = await admin.from('contractors').select('stripe_customer_id').eq('id', contractorId).single()

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: contractor?.stripe_customer_id,
    metadata: { contractor_id: contractorId, lead_id: leadId, type },
  })

  return intent.id
}
