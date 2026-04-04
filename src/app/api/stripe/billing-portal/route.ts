import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe/checkout'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('stripe_customer_id').eq('user_id', user.id).single()

    if (!contractor?.stripe_customer_id) {
      return structuredError('No billing account found', 404)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'
    const session = await createBillingPortalSession(
      contractor.stripe_customer_id,
      `${appUrl}/settings`
    )

    return Response.json({ url: session.url })
  } catch (err) {
    await logError('billing_portal', safeErrorMessage(err))
    return structuredError('Failed to create portal session', 500)
  }
}
