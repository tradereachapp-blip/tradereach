import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { pauseStripeSubscription, resumeStripeSubscription } from '@/lib/stripe/checkout'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { action } = body  // 'pause' or 'resume'

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    // Only Pro, Elite, Elite Plus can pause
    if (!['pro', 'elite', 'elite_plus'].includes(contractor.plan_type)) {
      return Response.json({ success: false, error: 'Pause is only available for subscription plans.' }, { status: 403 })
    }

    if (!contractor.stripe_subscription_id) {
      return Response.json({ success: false, error: 'No active subscription found.' }, { status: 400 })
    }

    if (action === 'pause') {
      // Check pause limit (2 per year)
      const pauseUsed = contractor.pause_months_used ?? 0
      if (pauseUsed >= 2) {
        return Response.json({
          success: false,
          error: 'You have used all 2 pause months for this year. Pause resets January 1st.',
          pause_months_used: pauseUsed,
        }, { status: 403 })
      }

      // Check not already paused
      if (contractor.pause_subscription_until) {
        const pauseEnd = new Date(contractor.pause_subscription_until)
        if (pauseEnd > new Date()) {
          return Response.json({
            success: false,
            error: `Subscription is already paused until ${pauseEnd.toLocaleDateString()}.`,
          }, { status: 400 })
        }
      }

      const pauseUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Pause Stripe billing
      await pauseStripeSubscription(contractor.stripe_subscription_id)

      // Update contractor record
      await admin.from('contractors').update({
        pause_subscription_until: pauseUntil.toISOString(),
        pause_months_used: pauseUsed + 1,
        subscription_status: 'paused',
      }).eq('id', contractor.id)

      return Response.json({
        success: true,
        action: 'paused',
        pause_until: pauseUntil.toISOString(),
        pause_months_used: pauseUsed + 1,
        pause_months_remaining: 1 - pauseUsed,
        message: `Your subscription is paused until ${pauseUntil.toLocaleDateString()}. Your ZIP territory is held during this time. Resume anytime from your dashboard.`,
      })

    } else if (action === 'resume') {
      if (!contractor.pause_subscription_until) {
        return Response.json({ success: false, error: 'Subscription is not paused.' }, { status: 400 })
      }

      // Resume Stripe billing
      await resumeStripeSubscription(contractor.stripe_subscription_id)

      // Update contractor record
      await admin.from('contractors').update({
        pause_subscription_until: null,
        subscription_status: 'active',
      }).eq('id', contractor.id)

      return Response.json({
        success: true,
        action: 'resumed',
        message: 'Your subscription has been resumed. You can now claim leads again.',
      })

    } else {
      return structuredError('Invalid action. Use pause or resume.', 400)
    }

  } catch (err) {
    await logError('pause_subscription_error', safeErrorMessage(err))
    return structuredError('Failed to process pause request', 500)
  }
}
