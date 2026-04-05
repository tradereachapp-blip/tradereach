import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createSubscriptionCheckout, createOrGetStripeCustomer } from '@/lib/stripe/checkout'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'
import { PRICING } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { plan_type, interval = 'monthly' } = body

    if (!['pro', 'elite'].includes(plan_type)) return structuredError('Invalid plan type', 400)
    if (!['monthly', 'annual'].includes(interval)) return structuredError('Invalid interval', 400)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    // Check founding member availability
    const { data: foundingRow } = await admin
      .from('founding_member_counts')
      .select('max_spots, filled_spots')
      .eq('plan_type', plan_type)
      .single()

    const spotsAvailable = foundingRow
      ? foundingRow.filled_spots < foundingRow.max_spots
      : false
    const maxSpots = plan_type === 'pro' ? PRICING.PRO_FOUNDING_SPOTS : PRICING.ELITE_FOUNDING_SPOTS

    let customerId = contractor.stripe_customer_id
    if (!customerId) {
      customerId = await createOrGetStripeCustomer(user.email!, contractor.contact_name, contractor.id)
      await admin.from('contractors').update({ stripe_customer_id: customerId }).eq('id', contractor.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'
    const session = await createSubscriptionCheckout({
      contractorId: contractor.id,
      planType: plan_type,
      interval,
      isFoundingMember: spotsAvailable,
      email: user.email!,
      stripeCustomerId: customerId,
      successUrl: `${appUrl}/onboarding?checkout=success&plan=${plan_type}&founding=${spotsAvailable}`,
      cancelUrl: `${appUrl}/onboarding`,
    })

    return Response.json({
      url: session.url,
      is_founding_member: spotsAvailable,
      spots_remaining: foundingRow ? Math.max(0, foundingRow.max_spots - foundingRow.filled_spots) : maxSpots,
    })
  } catch (err) {
    await logError('stripe_checkout_create', safeErrorMessage(err))
    return structuredError('Failed to create checkout session', 500)
  }
}
