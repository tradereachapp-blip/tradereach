import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, structuredError } from '@/lib/utils/error-logger'
import { stripe } from '@/lib/stripe/client'
import { sendMonthlyCreditsGrantedEmail, sendUpgradeConfirmationEmail, sendZipTerritoryChangeNotification, sendWinBackEmail, sendAccountManagerWelcomeEmail } from '@/lib/resend/templates'
import { getMonthlyCredits } from '@/lib/pricing'
import { recordZipClaim } from '@/lib/utils/zip-claims'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return structuredError('Missing signature or secret', 401)
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      await logError('stripe_webhook_sig_error', String(err))
      return structuredError('Webhook signature verification failed', 401)
    }

    const admin = createAdminClient()

    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as any
        const { data: contractor } = await admin
          .from('contractors')
          .select('id, user_id, plan_type, zip_codes, niche')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (contractor) {
          // Assign account manager for Elite Plus
          if (contractor.plan_type === 'elite_plus') {
            const { data: managers } = await admin
              .from('team_members')
              .select('id, user_id')
              .eq('role', 'account_manager')
              .eq('status', 'active')
              .limit(1)

            if (managers && managers.length > 0) {
              await admin.from('account_manager_assignments').insert({
                contractor_id: contractor.id,
                account_manager_id: managers[0].id,
                assigned_at: new Date().toISOString(),
                is_active: true,
              })

              const { data: userData } = await admin.auth.admin.getUserById(managers[0].user_id)
              const managerEmail = userData?.user?.email
              if (managerEmail) {
                await sendAccountManagerWelcomeEmail(managerEmail, contractor)
              }
            }
          }

          // Record initial ZIP claims for all existing ZIPs
          for (const zip of (contractor.zip_codes ?? [])) {
            const claimType = contractor.plan_type === 'elite' ? 'exclusive' : contractor.plan_type === 'elite_plus' ? 'super_exclusive' : 'available'
            await recordZipClaim(contractor.id, zip, contractor.niche, claimType, contractor.plan_type)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const previousAttrs = event.data.previous_attributes as any

        const { data: contractor } = await admin
          .from('contractors')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (contractor) {
          // Detect pause/resume via pause_collection status
          if (previousAttrs?.pause_collection !== undefined) {
            if (subscription.pause_collection?.resumes_at) {
              // Paused
              await admin.from('contractors').update({
                pause_subscription_until: new Date(subscription.pause_collection.resumes_at * 1000).toISOString(),
                subscription_status: 'paused',
              }).eq('id', contractor.id)
            } else if (previousAttrs.pause_collection) {
              // Resumed
              await admin.from('contractors').update({
                pause_subscription_until: null,
                subscription_status: 'active',
              }).eq('id', contractor.id)
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        await admin
          .from('contractors')
          .update({ subscription_status: 'cancelled', cancellation_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const { data: contractor } = await admin
          .from('contractors')
          .select('id, user_id, lead_credits_remaining, plan_type')
          .eq('stripe_customer_id', invoice.customer)
          .single()

        if (contractor && invoice.billing_reason === 'subscription_cycle') {
          // Monthly renewal: grant credits
          const monthlyGrant = getMonthlyCredits(contractor.plan_type)
          const newBalance = (contractor.lead_credits_remaining ?? 0) + monthlyGrant

          await admin.from('contractors').update({ lead_credits_remaining: newBalance }).eq('id', contractor.id)
          await admin.from('credit_transactions').insert({
            contractor_id: contractor.id,
            transaction_type: 'monthly_grant',
            amount: monthlyGrant,
            balance_after: newBalance,
            description: `Invoice #${invoice.number}: Monthly credit grant`,
          })

          const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
          const email = userData?.user?.email
          if (email) {
            await sendMonthlyCreditsGrantedEmail(email, contractor, monthlyGrant, newBalance, 30)
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any
        const { lead_id, contractor_id, type } = paymentIntent.metadata ?? {}

        if (lead_id && contractor_id) {
          if (type === 'overage') {
            // Grant 1 credit and mark lead as claimed
            const amount = paymentIntent.amount_received / 100
            await admin.from('contractors').update({ lead_credits_remaining: 1 }).eq('id', contractor_id)
            await admin.from('leads').update({ status: 'claimed', claimed_by_contractor_id: contractor_id }).eq('id', lead_id)
            await admin.from('credit_transactions').insert({
              contractor_id,
              transaction_type: 'overage_payment',
              amount: 1,
              balance_after: 1,
              lead_id,
              description: `Overage payment: $${amount.toFixed(2)}`,
            })
          } else if (type === 'pay_per_lead') {
            // Mark PPL lead as claimed
            await admin.from('leads').update({ status: 'claimed', claimed_by_contractor_id: contractor_id, payment_type: 'pay_per_lead' }).eq('id', lead_id)
          }
        }
        break
      }
    }

    return Response.json({ received: true })
  } catch (err) {
    await logError('stripe_webhook_error', String(err))
    return structuredError('Webhook processing failed', 500)
  }
}
