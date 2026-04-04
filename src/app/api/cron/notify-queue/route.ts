// ============================================================
// TradeReach — Notification Queue Processor
// Runs every 5 minutes via Vercel Cron.
//
// Advances the lead notification queue for any leads whose
// active contractor window has expired and the lead is still
// unclaimed. This is what makes the 15-minute Elite priority
// window actually work in real-time.
//
// Without this cron, processExpiredNotificationWindows() would
// only run once per day (from daily-cleanup) and the queue
// would never advance until the next morning.
// ============================================================

import { NextRequest } from 'next/server'
import { processExpiredNotificationWindows } from '@/lib/utils/notify-contractors'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const advanced = await processExpiredNotificationWindows()
    return Response.json({ success: true, windows_advanced: advanced })
  } catch (err) {
    await logError('notify_queue_cron_failed', safeErrorMessage(err))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
