import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendAdminCronSummary } from '@/lib/resend/templates'
import { processExpiredNotificationWindows } from '@/lib/utils/notify-contractors'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'
import { LEAD_EXPIRY_HOURS } from '@/lib/config'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const results: Record<string, unknown> = {}

  // 1. Expire stale leads
  try {
    const cutoff = new Date(Date.now() - LEAD_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
    const { data: expired } = await admin
      .from('leads').update({ status: 'expired' })
      .eq('status', 'available').lt('created_at', cutoff).select('id, zip, niche')
    results.expired_leads = expired?.length ?? 0
    await admin.from('errors').insert({
      type: 'info_cron_expired',
      message: `Expired ${results.expired_leads} leads older than ${LEAD_EXPIRY_HOURS}h`,
      context: { count: results.expired_leads },
    })
  } catch (err) {
    await logError('cron_expiry_failed', safeErrorMessage(err))
  }

  // 2. Coverage gap summary
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const { data: gaps } = await admin.from('errors').select('context')
      .eq('type', 'coverage_gap').gte('created_at', todayStart.toISOString())
    const gapList = (gaps ?? []).map(g => g.context as { lead_id: string; zip: string; niche: string })
    results.coverage_gaps = gapList.length
    await sendAdminCronSummary(results.expired_leads as number, gapList)
  } catch (err) {
    await logError('cron_summary_failed', safeErrorMessage(err))
  }

  // 3. Process expired notification windows — advance queue to next contractor
  try {
    const advanced = await processExpiredNotificationWindows()
    results.notification_windows_advanced = advanced
  } catch (err) {
    await logError('cron_notification_windows_failed', safeErrorMessage(err))
  }

  return Response.json({ success: true, results })
}
