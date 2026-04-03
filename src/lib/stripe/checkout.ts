import { stripe } from './client'
import type { PlanType } from '@/types'

interface CreateCheckoutOptions {
  contractorId: string
  planType: 'pro' | 'elite'
  email: string
  stripeCustomerId?: string | null
  successUrl: string
  cancelUrl: string
}

export async function createSubscriptionCheckout({
  contractorId,
  planType,
  email,
  stripeCustomerId,
  successUrl,
  cancelUrl,
}: CreateCheckoutOptions) {
  const priceId =
    planType === 'pro'
      ? process.env.STRIPE_PRO_PRICE_ID!
      : process.env.STRIPE_ELITE_PRICE_ID!

  const sessionConfig: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { contractor_id: contractorId, plan_type: planType },
    },
    metadata: { contractor_id: contractorId, plan_type: planType },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  }

  if (stripeCustomerId) {
    sessionConfig.customer = stripeCustomerId
  } else {
    sessionConfig.customer_email = email
  }

  return stripe.checkout.sessions.create(sessionConfig)
}

interface CreatePaymentIntentOptions {
  amountCents: number
  contractorId: string
  leadId: string
  stripeCustomerId?: string | null
  description: string
}

export async function createLeadPaymentIntent({
  amountCents,
  contractorId,
  leadId,
  stripeCustomerId,
  description,
}: CreatePaymentIntentOptions) {
  const config: Parameters<typeof stripe.paymentIntents.create>[0] = {
    amount: amountCents,
    currency: 'usd',
    description,
    metadata: { contractor_id: contractorId, lead_id: leadId },
    automatic_payment_methods: { enabled: true },
  }

  if (stripeCustomerId) {
    config.customer = stripeCustomerId
  }

  return stripe.paymentIntents.create(config)
}

export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string
) {
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
}

export async function createOrGetStripeCustomer(
  email: string,
  name: string,
  contractorId: string
): Promise<string> {
  // Check if customer already exists
  const existing = await stripe.customers.search({
    query: `email:'${email}'`,
    limit: 1,
  })

  if (existing.data.length > 0) {
    return existing.data[0].id
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { contractor_id: contractorId },
  })

  return customer.id
}
