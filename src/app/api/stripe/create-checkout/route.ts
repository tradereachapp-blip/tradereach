import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createSubscriptionCheckout, createOrGetStripeCustomer } from '@/lib/stripe/checkout'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { plan_type } = body
    if (!['pro', 'elite'].includes(plan_type)) return structuredError('Invalid plan type', 400)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    let customerId = contractor.stripe_customer_id
    if (!customerId) {
      customerId = await createOrGetStripeCustomer(user.email!, contractor.contact_name, contractor.id)
      await admin.from('contractors').update({ stripe_customer_id: customerId }).eq('id', contractor.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'
    const session = await createSubscriptionCheckout({
      contractorId: contractor.id, planType: plan_type, email: user.email!,
      stripeCustomerId: customerId,
      successUrl: `${appUrl}/onboarding?checkout=success&plan=${plan_type}`,
      cancelUrl: `${appUrl}/onboarding`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    await logError('stripe_checkout_create', safeErrorMessage(err))
    return structuredError('Failed to create checkout session', 500)
  }
}
