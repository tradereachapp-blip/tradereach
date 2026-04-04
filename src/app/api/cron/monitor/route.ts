// ============================================================
// TradeReach — System Monitoring Cron
// Runs every 5 minutes via Vercel Cron
// Checks 8 critical services, smart-alerts on 2nd consecutive failure
// ============================================================

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'

const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'
const ALERT_SMS = process.env.MONITORING_ALERT_PHONE ?? ''   // e.g. +16265551234
const ALERT_EMAIL = process.env.ADMIN_EMAIL ?? 'smohr1298@gmail.com'

// ── Types ────────────────────────────────────────────────────────────────────
type ServiceStatus = 'operational' | 'degraded' | 'down'

interface CheckResult {
  service: string
  status: ServiceStatus
  responseTimeMs: number
  errorMessage?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function timer() {
  const start = Date.now()
  return () => Date.now() - start
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ])
}

// ── Service Checks ───────────────────────────────────────────────────────────

async function checkDatabase(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    const admin = createAdminClient()
    await withTimeout(
      admin.from('leads').select('id', { count: 'exact', head: true }),
      5000
    )
    const ms = elapsed()
    return {
      service: 'database',
      status: ms > 500 ? 'degraded' : 'operational',
      responseTimeMs: ms,
      errorMessage: ms > 500 ? `Slow query: ${ms}ms` : undefined,
    }
  } catch (err) {
    return { service: 'database', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err) }
  }
}

async function checkLeadForm(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    const res = await withTimeout(
      fetch(`${APP_URL}/api/health/lead-form`, { method: 'GET', cache: 'no-store' }),
      8000
    )
    const ms = elapsed()
    if (!res.ok && res.status !== 405) {
      return { service: 'lead_form', status: 'down', responseTimeMs: ms, errorMessage: `HTTP ${res.status}` }
    }
    return { service: 'lead_form', status: ms > 3000 ? 'degraded' : 'operational', responseTimeMs: ms }
  } catch (err) {
    // If no /api/health/lead-form exists, check the form route directly
    try {
      const elapsed2 = timer()
      const res2 = await withTimeout(
        fetch(`${APP_URL}/api/leads/submit`, { method: 'HEAD', cache: 'no-store' }),
        8000
      )
      const ms2 = elapsed2()
      return {
        service: 'lead_form',
        status: res2.status < 500 ? 'operational' : 'down',
        responseTimeMs: ms2,
        errorMessage: res2.status >= 500 ? `HTTP ${res2.status}` : undefined,
      }
    } catch (err2) {
      return { service: 'lead_form', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err2) }
    }
  }
}

async function checkNotificationSystem(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    // Verify notification routing by checking the DB for recent notification activity
    const admin = createAdminClient()
    await withTimeout(
      admin.from('notifications').select('id', { count: 'exact', head: true }).gte(
        'sent_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ),
      5000
    )
    const ms = elapsed()
    return { service: 'notification_system', status: 'operational', responseTimeMs: ms }
  } catch (err) {
    return { service: 'notification_system', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err) }
  }
}

async function checkStripeWebhook(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    const res = await withTimeout(
      fetch(`${APP_URL}/api/stripe/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        cache: 'no-store',
      }),
      8000
    )
    const ms = elapsed()
    // Webhook returns 400 (bad signature) for invalid requests — that's fine, endpoint is up
    const ok = res.status < 500
    return {
      service: 'stripe_webhook',
      status: ok ? 'operational' : 'down',
      responseTimeMs: ms,
      errorMessage: !ok ? `HTTP ${res.status}` : undefined,
    }
  } catch (err) {
    return { service: 'stripe_webhook', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err) }
  }
}

async function checkTwilio(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!sid || !token) {
      return { service: 'twilio_sms', status: 'down', responseTimeMs: 0, errorMessage: 'Twilio credentials not configured' }
    }

    const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
    const res = await withTimeout(
      fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`, {
        headers: { 'Authorization': `Basic ${credentials}` },
        cache: 'no-store',
      }),
      8000
    )
    const ms = elapsed()
    if (!res.ok) {
      return { service: 'twilio_sms', status: 'down', responseTimeMs: ms, errorMessage: `Twilio API error: HTTP ${res.status}` }
    }
    const data = await res.json() as { balance: string; currency: string }
    const balance = parseFloat(data.balance)
    if (balance < 5) {
      return {
        service: 'twilio_sms',
        status: 'degraded',
        responseTimeMs: ms,
        errorMessage: `Low balance: $${balance.toFixed(2)} ${data.currency} (threshold: $5.00)`,
      }
    }
    return { service: 'twilio_sms', status: 'operational', responseTimeMs: ms }
  } catch (err) {
    return { service: 'twilio_sms', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err) }
  }
}

async function checkResend(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { service: 'resend_email', status: 'down', responseTimeMs: 0, errorMessage: 'RESEND_API_KEY not configured' }
    }
    const res = await withTimeout(
      fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        cache: 'no-store',
      }),
      8000
    )
    const ms = elapsed()
    return {
      service: 'resend_email',
      status: res.ok ? 'operational' : 'down',
      responseTimeMs: ms,
      errorMessage: !res.ok ? `Resend API error: HTTP ${res.status}` : undefined,
    }
  } catch (err) {
    return { service: 'resend_email', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err) }
  }
}

async function checkAuth(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return { service: 'auth', status: 'down', responseTimeMs: 0, errorMessage: 'SUPABASE_URL not configured' }
    }
    const res = await withTimeout(
      fetch(`${supabaseUrl}/auth/v1/health`, { cache: 'no-store' }),
      8000
    )
    const ms = elapsed()
    return {
      service: 'auth',
      status: res.ok ? 'operational' : 'down',
      responseTimeMs: ms,
      errorMessage: !res.ok ? `Auth health check: HTTP ${res.status}` : undefined,
    }
  } catch (err) {
    return { service: 'auth', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err) }
  }
}

async function checkAdminPanel(): Promise<CheckResult> {
  const elapsed = timer()
  try {
    const res = await withTimeout(
      fetch(`${APP_URL}/admin/login`, { method: 'HEAD', cache: 'no-store' }),
      8000
    )
    const ms = elapsed()
    return {
      service: 'admin_panel',
      status: res.ok || res.status === 405 ? 'operational' : 'down',
      responseTimeMs: ms,
      errorMessage: res.status >= 500 ? `HTTP ${res.status}` : undefined,
    }
  } catch (err) {
    return { service: 'admin_panel', status: 'down', responseTimeMs: elapsed(), errorMessage: safeErrorMessage(err) }
  }
}

// ── Alert Helpers ────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  database: 'Database (Supabase)',
  lead_form: 'Lead Form Endpoint',
  notification_system: 'Notification System',
  stripe_webhook: 'Stripe Webhook',
  twilio_sms: 'Twilio SMS',
  resend_email: 'Resend Email',
  auth: 'Authentication (Supabase Auth)',
  admin_panel: 'Admin Panel',
}

const SUGGESTED_FIXES: Record<string, string> = {
  database: 'Check Supabase dashboard for outages. Verify SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.',
  lead_form: 'Check Vercel function logs for the lead submission route. Verify the endpoint is deployed.',
  notification_system: 'Check Supabase notifications table. Verify Twilio/Resend credentials.',
  stripe_webhook: 'Check Stripe dashboard > Webhooks. Verify STRIPE_WEBHOOK_SECRET in Vercel env vars.',
  twilio_sms: 'Log in to Twilio console and add credits. Check account status at console.twilio.com.',
  resend_email: 'Check Resend dashboard at resend.com. Verify RESEND_API_KEY is valid.',
  auth: 'Check Supabase Auth settings. Verify project is active at supabase.com.',
  admin_panel: 'Check Vercel deployment logs. Verify admin routes are building correctly.',
}

async function sendAlertSMS(service: string, errorMessage: string) {
  if (!ALERT_SMS) return
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_PHONE_NUMBER
    if (!sid || !token || !from) return

    const body = `TradeReach ALERT: ${SERVICE_LABELS[service] ?? service} is down. Error: ${errorMessage.slice(0, 100)}. Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT. Check admin panel.`
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: ALERT_SMS, From: from, Body: body }),
    })
  } catch (err) {
    await logError('monitor_alert_sms_failed', safeErrorMessage(err))
  }
}

async function sendAlertEmail(service: string, errorMessage: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <div style="background:#dc2626;color:white;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
          <h1 style="margin:0;font-size:20px;">🚨 TradeReach System Alert</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:40%">Service</td><td style="padding:8px 0;color:#f87171;font-weight:bold">${SERVICE_LABELS[service] ?? service}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Status</td><td style="padding:8px 0;color:#f87171;font-weight:bold">DOWN</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Time</td><td style="padding:8px 0">${now} PT</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Error</td><td style="padding:8px 0;color:#fca5a5">${errorMessage}</td></tr>
        </table>
        <div style="background:#1e293b;padding:16px;border-radius:8px;border-left:4px solid #f59e0b;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#fcd34d;font-weight:bold">Suggested Fix</p>
          <p style="margin:8px 0 0;font-size:13px">${SUGGESTED_FIXES[service] ?? 'Check Vercel logs and Supabase dashboard.'}</p>
        </div>
        <a href="${APP_URL}/admin" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Open Admin Panel →</a>
      </div>`
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'alerts@tradereach.com',
        to: [ALERT_EMAIL],
        subject: `🚨 TradeReach ALERT: ${SERVICE_LABELS[service] ?? service} is down`,
        html,
      }),
    })
  } catch (err) {
    await logError('monitor_alert_email_failed', safeErrorMessage(err))
  }
}

async function sendRecoverySMS(service: string, durationMinutes: number) {
  if (!ALERT_SMS) return
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_PHONE_NUMBER
    if (!sid || !token || !from) return
    const body = `TradeReach RECOVERED: ${SERVICE_LABELS[service] ?? service} is back online after ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}.`
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: ALERT_SMS, From: from, Body: body }),
    })
  } catch (err) {
    await logError('monitor_recovery_sms_failed', safeErrorMessage(err))
  }
}

async function sendRecoveryEmail(service: string, durationMinutes: number) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <div style="background:#16a34a;color:white;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
          <h1 style="margin:0;font-size:20px;">✅ TradeReach Recovery Notice</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:40%">Service</td><td style="padding:8px 0;color:#4ade80;font-weight:bold">${SERVICE_LABELS[service] ?? service}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Status</td><td style="padding:8px 0;color:#4ade80;font-weight:bold">RECOVERED ✓</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Recovered at</td><td style="padding:8px 0">${now} PT</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Outage duration</td><td style="padding:8px 0">${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}</td></tr>
        </table>
        <a href="${APP_URL}/admin" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Status Dashboard →</a>
      </div>`
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'alerts@tradereach.com',
        to: [ALERT_EMAIL],
        subject: `✅ TradeReach RECOVERED: ${SERVICE_LABELS[service] ?? service} is back online`,
        html,
      }),
    })
  } catch (err) {
    await logError('monitor_recovery_email_failed', safeErrorMessage(err))
  }
}

// ── Main Cron Handler ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const checkedAt = new Date().toISOString()

  // Run all 8 checks in parallel
  const results = await Promise.all([
    checkDatabase(),
    checkLeadForm(),
    checkNotificationSystem(),
    checkStripeWebhook(),
    checkTwilio(),
    checkResend(),
    checkAuth(),
    checkAdminPanel(),
  ])

  // Get the last 2 checks per service for smart alerting
  const { data: recentChecks } = await admin
    .from('system_health')
    .select('service_name, status, alerted, checked_at')
    .gte('checked_at', new Date(Date.now() - 20 * 60 * 1000).toISOString()) // last 20 min
    .order('checked_at', { ascending: false })

  // Group recent checks by service
  const prevByService: Record<string, { status: string; alerted: boolean; checked_at: string }[]> = {}
  for (const check of recentChecks ?? []) {
    if (!prevByService[check.service_name]) prevByService[check.service_name] = []
    if (prevByService[check.service_name].length < 2) {
      prevByService[check.service_name].push(check)
    }
  }

  // Log all results to DB
  const rowsToInsert = results.map(r => ({
    checked_at: checkedAt,
    service_name: r.service,
    status: r.status,
    response_time_ms: r.responseTimeMs,
    error_message: r.errorMessage ?? null,
    alerted: false,
  }))

  const { data: insertedRows } = await admin
    .from('system_health')
    .insert(rowsToInsert)
    .select('id, service_name')

  // Build id map
  const idByService: Record<string, string> = {}
  for (const row of insertedRows ?? []) {
    idByService[row.service_name] = row.id
  }

  // ── Smart Alerting ──────────────────────────────────────────────────────────
  const alertPromises: Promise<void>[] = []

  for (const result of results) {
    const prev = prevByService[result.service] ?? []
    const prevCheck = prev[0] // most recent previous check
    const rowId = idByService[result.service]

    if (result.status === 'down') {
      // Check if previous check was also down
      const prevWasDown = prevCheck?.status === 'down'
      const alreadyAlerted = prev.some(p => p.alerted === true)

      if (prevWasDown && !alreadyAlerted) {
        // 2nd consecutive failure — fire alert
        alertPromises.push(sendAlertSMS(result.service, result.errorMessage ?? 'Unknown error'))
        alertPromises.push(sendAlertEmail(result.service, result.errorMessage ?? 'Unknown error'))
        // Mark this row as alerted
        if (rowId) {
          alertPromises.push(
            admin.from('system_health').update({ alerted: true }).eq('id', rowId).then(() => {})
          )
        }
        await logError('monitor_alert_fired', `${result.service} down: ${result.errorMessage}`)
      }
    } else if (result.status === 'operational' && prevCheck?.status === 'down' && prev.some(p => p.alerted)) {
      // Service recovered — find how long it was down
      const { data: outageStart } = await admin
        .from('system_health')
        .select('checked_at')
        .eq('service_name', result.service)
        .eq('status', 'down')
        .order('checked_at', { ascending: true })
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .single()

      const durationMs = outageStart
        ? Date.now() - new Date(outageStart.checked_at).getTime()
        : 5 * 60 * 1000
      const durationMinutes = Math.round(durationMs / 60000)

      alertPromises.push(sendRecoverySMS(result.service, durationMinutes))
      alertPromises.push(sendRecoveryEmail(result.service, durationMinutes))

      // Mark recovered rows
      await admin
        .from('system_health')
        .update({ recovered_at: checkedAt })
        .eq('service_name', result.service)
        .eq('status', 'down')
        .is('recovered_at', null)
    }
  }

  await Promise.allSettled(alertPromises)

  const summary = results.reduce((acc, r) => {
    acc[r.service] = { status: r.status, ms: r.responseTimeMs }
    return acc
  }, {} as Record<string, { status: string; ms: number }>)

  return Response.json({ success: true, checked_at: checkedAt, services: summary })
}
