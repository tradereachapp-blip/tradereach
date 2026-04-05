import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, structuredError } from '@/lib/utils/error-logger'
import { sendWinBackEmail } from '@/lib/resend/templates'
import { resumeStripeSubscription } from '@/lib/stripe/checkout'

export const dynamic = 'force-dynamic'

// Cron: daily at 8am UTC
// Auto-resume paused subscriptions after 30 days
// Schedule win-back emails for cancelled subscribers

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return structuredError('Unauthorized', 401)
  }

  try {
    const admin = createAdminClient()
    const now = new Date()

    // Auto-resume paused subscriptions
    const { data: pausedContractors } = await admin
      .from('contractors')
      .select('id, stripe_subscription_id, pause_subscription_until')
      .eq('subscription_status', 'paused')
      .not('pause_subscription_until', 'is', null)

    let resumed = 0

    for (const contractor of (pausedContractors ?? [])) {
      try {
        const pauseUntil = new Date(contractor.pause_subscription_until)
        if (pauseUntil <= now && contractor.stripe_subscription_id) {
          // Auto-resume
          await resumeStripeSubscription(contractor.stripe_subscription_id)
          await admin.from('contractors').update({
            pause_subscription_until: null,
            subscription_status: 'active',
          }).eq('id', contractor.id)
          resumed++
        }
      } catch (err) {
        await logError('pause_resume_auto_resume_error', `Contractor ${contractor.id}: ${String(err)}`)
      }
    }

    // Schedule win-back emails for cancelled subscribers
    const { data: cancelledContractors } = await admin
      .from('contractors')
      .select('id, user_id, plan_type, cancellation_at')
      .not('cancellation_at', 'is', null)
      .eq('subscription_status', 'cancelled')

    let winBackEmails = 0

    for (const contractor of (cancelledContractors ?? [])) {
      try {
        const cancelledDate = new Date(contractor.cancellation_at)
        const daysSinceCancellation = Math.floor((now.getTime() - cancelledDate.getTime()) / (1000 * 60 * 60 * 24))

        // Check if 30-day win-back email should be sent
        if (daysSinceCancellation === 30) {
          const { data: c } = await admin
            .from('contractors')
            .select('win_back_email_30_sent')
            .eq('id', contractor.id)
            .single()

          if (!c?.win_back_email_30_sent) {
            const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
            const email = userData?.user?.email
            if (email) {
              await sendWinBackEmail(email, contractor, 30)
              await admin.from('contractors').update({
                win_back_email_30_sent: true,
              }).eq('id', contractor.id)
              winBackEmails++
            }
          }
        }

        // Check if 90-day win-back email should be sent
        if (daysSinceCancellation === 90) {
          const { data: c } = await admin
            .from('contractors')
            .select('win_back_email_90_sent')
            .eq('id', contractor.id)
            .single()

          if (!c?.win_back_email_90_sent) {
            const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
            const email = userData?.user?.email
            if (email) {
              await sendWinBackEmail(email, contractor, 90)
              await admin.from('contractors').update({
                win_back_email_90_sent: true,
              }).eq('id', contractor.id)
              winBackEmails++
            }
          }
        }
      } catch (err) {
        await logError('pause_resume_winback_error', `Contractor ${contractor.id}: ${String(err)}`)
      }
    }

    return Response.json({
      success: true,
      resumed,
      winback_emails_sent: winBackEmails,
      message: `Resumed ${resumed} paused subscriptions and sent ${winBackEmails} win-back emails`,
    })
  } catch (err) {
    await logError('pause_resume_cron_fatal', String(err))
    return structuredError('Cron job failed', 500)
  }
}
