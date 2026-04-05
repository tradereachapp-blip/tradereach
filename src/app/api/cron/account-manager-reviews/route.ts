import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, structuredError } from '@/lib/utils/error-logger'
import { sendAccountManagerReviewEmail } from '@/lib/resend/templates'

export const dynamic = 'force-dynamic'

// Cron: 1st of month at 9am UTC
// Generate and send monthly performance reports for Elite Plus subscribers

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return structuredError('Unauthorized', 401)
  }

  try {
    const admin = createAdminClient()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { data: elitePlusContractors } = await admin
      .from('contractors')
      .select('id, user_id, email, company_name, niche')
      .eq('plan_type', 'elite_plus')
      .eq('subscription_status', 'active')

    let processed = 0
    let errors = 0

    for (const contractor of (elitePlusContractors ?? [])) {
      try {
        const { data: claims } = await admin
          .from('lead_claims')
          .select('*')
          .eq('contractor_id', contractor.id)
          .gte('claimed_at', monthStart)
          .lt('claimed_at', monthEnd)

        const { data: creditUsage } = await admin
          .from('credit_transactions')
          .select('amount')
          .eq('contractor_id', contractor.id)
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd)

        const totalClaims = claims?.length ?? 0
        const totalCreditsUsed = (creditUsage ?? []).reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0)

        const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
        const email = userData?.user?.email

        if (email) {
          await sendAccountManagerReviewEmail(email, contractor, {
            claims_this_month: totalClaims,
            credits_used: totalCreditsUsed,
            period_start: new Date(monthStart).toLocaleDateString(),
            period_end: new Date(monthEnd).toLocaleDateString(),
          })
        }

        processed++
      } catch (err) {
        errors++
        await logError('account_manager_review_cron_error', `Contractor ${contractor.id}: ${String(err)}`)
      }
    }

    return Response.json({
      success: true,
      processed,
      errors,
      message: `Account manager reviews sent to ${processed} Elite Plus contractors`,
    })
  } catch (err) {
    await logError('account_manager_review_cron_fatal', String(err))
    return structuredError('Cron job failed', 500)
  }
}
