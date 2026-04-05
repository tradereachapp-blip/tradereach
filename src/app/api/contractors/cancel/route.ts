import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { cancelStripeSubscriptionAtPeriodEnd } from '@/lib/stripe/checkout'
import { sendCancellationEmail } from '@/lib/resend/templates'
import { stripe } from '@/lib/stripe/client'

// GET /api/contractors/cancel — get cancellation preview (consequences + retention offers)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    // Get subscription details for period end date
    let accessUntil: string | null = null
    if (contractor.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(contractor.stripe_subscription_id)
        accessUntil = new Date(sub.current_period_end * 1000).toISOString()
      } catch { /* ignore */ }
    }

    const credits = contractor.lead_credits_remaining ?? 0
    const isFoundingMember = contractor.founding_member ?? false
    const foundingLockedPrice = contractor.founding_member_locked_price

    return Response.json({
      access_until: accessUntil,
      credits_to_lose: credits,
      is_founding_member: isFoundingMember,
      founding_locked_price: foundingLockedPrice,
      founding_warning: isFoundingMember ? `You will permanently lose your Founding Member rate of $${foundingLockedPrice}/month. If you resubscribe, you will pay the full current price.` : null,
      zip_count: (contractor.zip_codes ?? []).length,
      pause_months_used: contractor.pause_months_used ?? 0,
      can_pause: (contractor.pause_months_used ?? 0) < 2,
    })
  } catch (err) {
    await logError('cancel_preview_error', safeErrorMessage(err))
    return structuredError('Failed to get cancellation info', 500)
  }
}

// POST /api/contractors/cancel — process cancellation or record retention attempt
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return structuredError('Unauthorized', 401)

    const body = await request.json()
    const { action, reason, retentionOfferResult, confirmation_text } = body

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors').select('*').eq('user_id', user.id).single()
    if (!contractor) return structuredError('Contractor not found', 404)

    if (action === 'record_reason') {
      // Step 1: Record reason and return retention offer
      const offer = getRetentionOffer(reason, contractor)
      await admin.from('cancellation_retention').insert({
        contractor_id: contractor.id,
        reason: reason,
        retention_offer: offer.type,
      })
      return Response.json({ success: true, offer })
    }

    if (action === 'confirm_cancel') {
      // Final cancellation — requires CANCEL typed confirmation
      if (confirmation_text !== 'CANCEL') {
        return Response.json({ success: false, error: 'Type CANCEL to confirm cancellation.' }, { status: 400 })
      }

      if (!contractor.stripe_subscription_id) {
        return Response.json({ success: false, error: 'No active subscription found.' }, { status: 400 })
      }

      // Cancel at period end (not immediately)
      await cancelStripeSubscriptionAtPeriodEnd(contractor.stripe_subscription_id)

      // Record cancellation
      await admin.from('contractors').update({
        cancellation_reason: reason ?? 'unspecified',
        cancellation_at: new Date().toISOString(),
      }).eq('id', contractor.id)

      // Update retention record
      await admin
        .from('cancellation_retention')
        .update({ cancelled_anyway: true })
        .eq('contractor_id', contractor.id)
        .order('created_at', { ascending: false })
        .limit(1)

      // Send confirmation email
      const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
      const email = userData?.user?.email
      if (email) {
        await sendCancellationEmail(email, contractor)
      }

      // Get period end date
      let accessUntil: string | null = null
      try {
        const sub = await stripe.subscriptions.retrieve(contractor.stripe_subscription_id)
        accessUntil = new Date(sub.current_period_end * 1000).toISOString()
      } catch { /* ignore */ }

      return Response.json({
        success: true,
        access_until: accessUntil,
        message: `Your subscription has been cancelled. You retain access until ${accessUntil ? new Date(accessUntil).toLocaleDateString() : 'end of billing period'}.`,
      })
    }

    return structuredError('Invalid action', 400)
  } catch (err) {
    await logError('cancellation_error', safeErrorMessage(err))
    return structuredError('Failed to process cancellation', 500)
  }
}

function getRetentionOffer(reason: string, contractor: Record<string, unknown>) {
  const offers: Record<string, { type: string; title: string; description: string; cta: string }> = {
    'not_enough_leads': {
      type: 'bonus_credits',
      title: 'We hear you — here\'s 5 bonus credits on us',
      description: 'We\'ll add 5 free credits to your account for next month while we work on increasing lead volume in your area.',
      cta: 'Accept 5 Bonus Credits',
    },
    'low_quality': {
      type: 'zip_review',
      title: 'Let us review and optimize your coverage',
      description: 'Our team will personally review your ZIP codes and lead history to optimize your setup. Connect with support now.',
      cta: 'Schedule ZIP Review',
    },
    'too_expensive': {
      type: 'downgrade',
      title: 'Stay with a plan that fits your budget',
      description: `Downgrade to a lower tier and save money while keeping your territory. Your ${(contractor.founding_member ? 'Founding Member ' : '')}pricing is locked if you stay.`,
      cta: 'See Lower Plans',
    },
    'found_better_service': {
      type: 'discount_offer',
      title: 'One month at 50% off — let us prove our value',
      description: 'We\'d love the chance to show you what TradeReach can do. Stay for one month at half price.',
      cta: 'Accept 50% Off',
    },
    'taking_a_break': {
      type: 'pause',
      title: 'Pause your subscription instead',
      description: 'Pausing keeps your territory protected for up to 30 days with no billing. Resume anytime.',
      cta: 'Pause Instead',
    },
    'other': {
      type: 'support',
      title: 'Let\'s talk — our team wants to help',
      description: 'Before you go, let us connect you with our support team to address your specific situation.',
      cta: 'Talk to Support',
    },
  }

  return offers[reason] ?? offers['other']
}
