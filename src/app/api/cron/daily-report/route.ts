// ============================================================
// TradeReach — Daily Health Report Cron
// Runs every day at 8am PT (15:00 UTC) via Vercel Cron
// Sends a morning summary email with platform health + business metrics
// ============================================================

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'smohr1298@gmail.com'

const SERVICE_LABELS: Record<string, string> = {
  database: 'Database',
  lead_form: 'Lead Form',
  notification_system: 'Notifications',
  stripe_webhook: 'Stripe Webhook',
  twilio_sms: 'Twilio SMS',
  resend_email: 'Resend Email',
  auth: 'Auth',
  admin_panel: 'Admin Panel',
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      { count: leadsYesterday },
      { count: signupsYesterday },
      { data: recentErrors },
      { data: healthChecks },
    ] = await Promise.all([
      admin.from('leads').select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString()),
      admin.from('contractors').select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString()),
      admin.from('errors').select('type, message, created_at')
        .gte('created_at', yesterdayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(10),
      admin.from('system_health').select('service_name, status, response_time_ms, checked_at, error_message, recovered_at')
        .gte('checked_at', yesterdayStart.toISOString())
        .order('checked_at', { ascending: false }),
    ])

    const serviceStats: Record<string, { total: number; operational: number; incidents: number; avgMs: number }> = {}
    for (const check of healthChecks ?? []) {
      if (!serviceStats[check.service_name]) {
        serviceStats[check.service_name] = { total: 0, operational: 0, incidents: 0, avgMs: 0 }
      }
      const s = serviceStats[check.service_name]
      s.total++
      if (check.status === 'operational') s.operational++
      if (check.status === 'down') s.incidents++
      s.avgMs = Math.round((s.avgMs * (s.total - 1) + (check.response_time_ms ?? 0)) / s.total)
    }

    const incidents = (healthChecks ?? [])
      .filter(h => h.status === 'down')
      .reduce((acc, h) => {
        const key = h.service_name
        if (!acc[key]) acc[key] = { service: key, firstSeen: h.checked_at, lastSeen: h.checked_at, recovered: !!h.recovered_at }
        if (h.checked_at < acc[key].firstSeen) acc[key].firstSeen = h.checked_at
        return acc
      }, {} as Record<string, { service: string; firstSeen: string; lastSeen: string; recovered: boolean }>)

    let twilioBalance = 'N/A'
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID
      const token = process.env.TWILIO_AUTH_TOKEN
      if (sid && token) {
        const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`, {
          headers: { 'Authorization': `Basic ${credentials}` },
        })
        if (res.ok) {
          const data = await res.json() as { balance: string; currency: string }
          twilioBalance = `$${parseFloat(data.balance).toFixed(2)} ${data.currency}`
        }
      }
    } catch { /* skip */ }

    const uptimeRows = Object.entries(serviceStats).map(([svc, s]) => {
      const uptime = s.total > 0 ? ((s.operational / s.total) * 100).toFixed(1) : '100.0'
      const color = parseFloat(uptime) >= 99 ? '#4ade80' : parseFloat(uptime) >= 95 ? '#fbbf24' : '#f87171'
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #1e293b">${SERVICE_LABELS[svc] ?? svc}</td><td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:${color};font-weight:bold">${uptime}%</td><td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#64748b">${s.avgMs}ms avg</td><td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:${s.incidents > 0 ? '#f87171' : '#64748b'}">${s.incidents} incident${s.incidents !== 1 ? 's' : ''}</td></tr>`
    }).join('')

    const incidentList = Object.values(incidents)
    const incidentRows = incidentList.length === 0
      ? '<tr><td colspan="3" style="padding:12px;color:#4ade80;text-align:center">No incidents yesterday</td></tr>'
      : incidentList.map(i => {
          const start = new Date(i.firstSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' })
          return `<tr><td style="padding:8px 12px;border-bottom:1px solid #1e293b">${SERVICE_LABELS[i.service] ?? i.service}</td><td style="padding:8px 12px;border-bottom:1px solid #1e293b">${start} PT</td><td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:${i.recovered ? '#4ade80' : '#f87171'}">${i.recovered ? 'Resolved' : 'Ongoing'}</td></tr>`
        }).join('')

    const errorRows = (recentErrors ?? []).length === 0
      ? '<li style="color:#4ade80">No errors logged yesterday</li>'
      : (recentErrors ?? []).map(e =>
          `<li style="margin-bottom:8px"><span style="color:#f87171">[${e.type}]</span> ${e.message?.slice(0, 80)}</li>`
        ).join('')

    const dateLabel = yesterdayStart.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const overallUptime = Object.values(serviceStats).length > 0
      ? (Object.values(serviceStats).reduce((sum, s) => sum + (s.total > 0 ? s.operational / s.total : 1), 0)
          / Object.values(serviceStats).length * 100).toFixed(1)
      : '100.0'

    const html = `<div style="font-family:Arial,sans-serif">Daily Report for ${dateLabel}. Uptime: ${overallUptime}%. Leads: ${leadsYesterday ?? 0}. Signups: ${signupsYesterday ?? 0}.</div>`

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'reports@tradereach.com',
        to: [ADMIN_EMAIL],
        subject: `TradeReach Daily Report - ${dateLabel}`,
        html,
      }),
    })

    return Response.json({ success: true, date: dateLabel, uptime: overallUptime, leads: leadsYesterday })
  } catch (err) {
    await logError('daily_report_failed', safeErrorMessage(err))
    return Response.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
