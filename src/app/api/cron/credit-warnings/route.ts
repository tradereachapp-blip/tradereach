import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, structuredError } from '@/lib/utils/error-logger'
import { sendLowCreditWarningEmail, sendUnusedCreditsNotification } from '@/lib/resend/templates'

export const dynamic = 'force-dynamic'

// Cron: daily at 2pm UTC
// Alert contractors with low credits (>80% used in past 30 days)
// Alert contractors with unused credits (non-zero but unclaimed leads)

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return structuredError('Unauthorized', 401)
  }

  try {
    const admin = createAdminClient()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get all Pro/Elite/Elite Plus contractors with remaining credits
    const { data: contractors } = await admin
      .from('contractors')
      .select('id, user_id, plan_type, lead_credits_remaining')
      .in('plan_type', ['pro', 'elite', 'elite_plus'])
      .eq('subscription_status', 'active')
      .gt('lead_credits_remaining', 0)

    let lowCreditAlerts = 0
    let unusedCreditAlerts = 0

    for (const contractor of (contractors ?? [])) {
      try {
        const { data: creditTxns } = await admin
          .from('credit_transactions')
          .select('amount')
          .eq('contractor_id', contractor.id)
          .gte('created_at', thirtyDaysAgo)

        const creditsUsed = (creditTxns ?? []).reduce((sum, t) => sum + Math.abs(Math.min(t.amount ?? 0, 0)), 0)
        const monthlyGrant = getMonthlyCredits(contractor.plan_type)

        // Alert if used > 80% of monthly grant
        if (creditsUsed > monthlyGrant * 0.8) {
          const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
          const email = userData?.user?.email
          if (email) {
            await sendLowCreditWarningEmail(email, contractor, creditsUsed, monthlyGrant)
            lowCreditAlerts++
          }
        }

        // Alert if unused credits (not claimed but have balance)
        if (contractor.lead_credits_remaining > monthlyGrant / 2) {
          const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
          const email = userData?.user?.email
          if (email) {
            await sendUnusedCreditsNotification(email, contractor, contractor.lead_credits_remaining)
            unusedCreditAlerts++
          }
        }
      } catch (err) {
        await logError('credit_warning_cron_error', `Contractor ${contractor.id}: ${String(err)}`)
      }
    }

    return Response.json({
      success: true,
      low_credit_alerts: lowCreditAlerts,
      unused_credit_alerts: unusedCreditAlerts,
      message: `Sent ${lowCreditAlerts} low credit and ${unusedCreditAlerts} unused credit alerts`,
    })
  } catch (err) {
    await logError('credit_warning_cron_fatal', String(err))
    return structuredError('Cron job failed', 500)
  }
}

function getMonthlyCredits(planType: string) {
  const credits: Record<string, number> = {
    pro: 15,
    elite: 30,
    elite_plus: 60,
  }
  return credits[planType] ?? 0
}
