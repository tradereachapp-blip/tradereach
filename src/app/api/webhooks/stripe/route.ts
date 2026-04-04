import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'
import { sendPaymentFailedEmail, sendCancellationEmail } from '@/lib/resend/templates'
import { sendPaymentFailedSMS } from '@/lib/twilio/sms'
import type Stripe from 'stripe'

// IMPORTANT: Stripe needs the raw body for signature verification — read via request.text()
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    await logError('webhook_signature_invalid', safeErrorMessage(err))
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      // -------------------------------------------------------
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const contractorId = sub.metadata?.contractor_id
        const planType = sub.metadata?.plan_type as 'pro' | 'elite'

        if (!contractorId || !planType) break

        // Always check DB state before updating (handle out-of-order events)
        const { data: contractor } = await admin
          .from('contractors').select('*').eq('id', contractorId).single()
        if (!contractor) break

        await admin.from('contractors').update({
          plan_type: planType,
          subscription_status: sub.status === 'trialing' ? 'trialing' : 'active',
          stripe_subscription_id: sub.id,
          leads_reset_at: new Date(sub.current_period_start * 1000).toISOString(),
        }).eq('id', contractorId)

        break
      }

      // -------------------------------------------------------
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const contractorId = sub.metadata?.contractor_id
        const planType = sub.metadata?.plan_type as 'pro' | 'elite'

        if (!contractorId) break

        let status: string
        switch (sub.status) {
          case 'trialing': status = 'trialing'; break
          case 'active': status = 'active'; break
          case 'past_due': status = 'past_due'; break
          case 'canceled': status = 'canceled'; break
          case 'unpaid': status = 'past_due'; break
          default: status = 'inactive'
        }

        const updateData: Record<string, unknown> = {
          subscription_status: status,
          stripe_subscription_id: sub.id,
        }
        if (planType) updateData.plan_type = planType

        await admin.from('contractors').update(updateData).eq('id', contractorId)
        break
      }

      // -------------------------------------------------------
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const contractorId = sub.metadata?.contractor_id
        if (!contractorId) break

        await admin.from('contractors').update({
          subscription_status: 'canceled',
          plan_type: 'none',
        }).eq('id', contractorId)

        // Send cancellation notifications
        const { data: contractor } = await admin
          .from('contractors').select('*').eq('id', contractorId).single()
        if (contractor) {
          const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
          const email = userData?.user?.email
          if (email) await sendCancellationEmail(email, contractor)
        }

        break
      }

      // -------------------------------------------------------
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const sub = invoice.subscription as string
        if (!sub) break

        // Find contractor by subscription ID
        const { data: contractor } = await admin
          .from('contractors')
          .select('*')
          .eq('stripe_subscription_id', sub)
          .single()

        if (!contractor) break

        // On Pro renewal — reset monthly lead count
        if (contractor.plan_type === 'pro') {
          await admin.from('contractors').update({
            leads_used_this_month: 0,
            leads_reset_at: new Date().toISOString(),
            subscription_status: 'active',
          }).eq('id', contractor.id)
        } else {
          await admin.from('contractors').update({
            subscription_status: 'active',
          }).eq('id', contractor.id)
        }

        break
      }

      // -------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const sub = invoice.subscription as string
        if (!sub) break

        const { data: contractor } = await admin
          .from('contractors')
          .select('*')
          .eq('stripe_subscription_id', sub)
          .single()

        if (!contractor) break

        await admin.from('contractors').update({
          subscription_status: 'past_due',
        }).eq('id', contractor.id)

        // Notify contractor via email and SMS
        const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
        const email = userData?.user?.email

        if (email) await sendPaymentFailedEmail(email, contractor)
        await sendPaymentFailedSMS(contractor)

        break
      }

      // -------------------------------------------------------
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        const contractorId = intent.metadata?.contractor_id
        const leadId = intent.metadata?.lead_id

        if (!contractorId || !leadId) break

        // Verify lead is still available before claiming
        const { data: lead } = await admin
          .from('leads').select('*').eq('id', leadId).single()
        if (!lead || lead.status !== 'available') break

        const { data: contractor } = await admin
          .from('contractors').select('*').eq('id', contractorId).single()
        if (!contractor) break

        // Claim the lead
        await admin.from('leads').update({
          status: 'claimed',
          claimed_by: contractorId,
          claimed_at: new Date().toISOString(),
        }).eq('id', leadId).eq('status', 'available') // Atomic guard

        // Record claim
        const isOverage = contractor.plan_type === 'pro' && contractor.leads_used_this_month >= 30
        await admin.from('lead_claims').insert({
          lead_id: leadId,
          contractor_id: contractorId,
          payment_type: 'pay_per_lead',
          amount_charged: intent.amount / 100,
          stripe_payment_intent_id: intent.id,
        })

        // Increment usage count for Pro
        if (contractor.plan_type === 'pro') {
          await admin.from('contractors').update({
            leads_used_this_month: contractor.leads_used_this_month + 1,
          }).eq('id', contractorId)
        }

        break
      }

      default:
        // Ignore unhandled event types
        break
    }

    return Response.json({ received: true })
  } catch (err) {
    await logError('webhook_processing', safeErrorMessage(err), { event_type: event.type, event_id: event.id })
    // Return 200 to prevent Stripe from retrying — we already logged the error
    return Response.json({ received: true, error: 'Internal processing error' })
  }
}
