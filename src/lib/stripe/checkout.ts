import { stripe } from './client'

export async function createCheckoutSession(customerId: string, priceId: string, trialDays: number = 7) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    trial_period_days: trialDays,
    allow_promotion_codes: true,
  })
  return session.url
}

export async function pauseStripeSubscription(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      resumes_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
  })
}

export async function resumeStripeSubscription(subscriptionId: string) {
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {},
  })
}

export async function cancelStripeSubscriptionAtPeriodEnd(subscriptionId: string) {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function updateSubscriptionPrice(subscriptionId: string, newPriceId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const itemId = sub.items.data[0].id
  
  await stripe.subscriptionItems.update(itemId, {
    price: newPriceId,
  })
}
