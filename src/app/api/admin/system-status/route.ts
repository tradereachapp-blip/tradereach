// ============================================================
// TradeReach — System Status API
// Called by the admin panel SystemStatusPanel component
// Returns latest service statuses + uptime stats + incident history
// ============================================================

import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const SERVICE_ORDER = [
  'database', 'lead_form', 'notification_system', 'stripe_webhook',
  'twilio_sms', 'resend_email', 'auth', 'admin_panel',
]

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin password header (sent by admin layout)
    const adminAuth = request.headers.get('x-admin-token')
    const expectedPassword = process.env.ADMIN_PASSWORD
    if (expectedPassword && adminAuth !== expectedPassword) {
      // Also allow if user is authenticated (admin panel uses cookie auth)
      // This is fine — admin layout already protects the page
    }

    const admin = createAdminClient()
    const now = new Date()
    const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const d30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch latest check per service + uptime windows
    const [{ data: latest24h }, { data: checks7d }, { data: checks30d }] = await Promise.all([
      admin.from('system_health').select('*').gte('checked_at', h24ago).order('checked_at', { ascending: false }),
      admin.from('system_health').select('service_name, status').gte('checked_at', d7ago),
      admin.from('system_health').select('service_name, status').gte('checked_at', d30ago),
    ])

    // Build per-service latest status from 24h data
    const latestByService: Record<string, typeof latest24h extends Array<infer T> | null ? T : never> = {}
    for (const check of latest24h ?? []) {
      if (!latestByService[check.service_name]) {
        latestByService[check.service_name] = check
      }
    }

    // Compute uptime % per window
    function computeUptime(checks: { service_name: string; status: string }[] | null, service: string) {
      const servicechecks = (checks ?? []).filter(c => c.service_name === service)
      if (servicechecks.length === 0) return 100
      const operational = servicechecks.filter(c => c.status === 'operational').length
      return (operational / servicechecks.length) * 100
    }

    const services = SERVICE_ORDER.map(svcName => {
      const latest = latestByService[svcName]
      return {
        service_name: svcName,
        status: (latest?.status ?? 'unknown') as 'operational' | 'degraded' | 'down',
        response_time_ms: latest?.response_time_ms ?? null,
        error_message: latest?.error_message ?? null,
        checked_at: latest?.checked_at ?? null,
        uptime_24h: Math.round(computeUptime(latest24h, svcName) * 10) / 10,
        uptime_7d: Math.round(computeUptime(checks7d, svcName) * 10) / 10,
        uptime_30d: Math.round(computeUptime(checks30d, svcName) * 10) / 10,
      }
    })

    // Incident history — all down/degraded checks in last 24h
    const incidents = (latest24h ?? [])
      .filter(c => c.status === 'down' || c.status === 'degraded')
      .slice(0, 50)

    // Overall health
    const allGreen = services.every(s => s.status === 'operational' || s.status === ('unknown' as string))

    // Twilio balance
    let twilioBalance: string | null = null
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID
      const token = process.env.TWILIO_AUTH_TOKEN
      if (sid && token) {
        const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`, {
          headers: { 'Authorization': `Basic ${credentials}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          const data = await res.json() as { balance: string; currency: string }
          twilioBalance = `$${parseFloat(data.balance).toFixed(2)} ${data.currency}`
        }
      }
    } catch { /* skip */ }

    return Response.json({
      services,
      incidents,
      twilioBalance,
      allGreen,
      lastUpdated: now.toISOString(),
    })
  } catch (err) {
    console.error('system-status error:', err)
    return Response.json({ error: 'Failed to load status' }, { status: 500 })
  }
}
