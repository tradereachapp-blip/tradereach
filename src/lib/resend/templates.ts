// ============================================================
// TradeReach — All Transactional Email Senders
//
// From addresses per email type:
//   Lead notifications      ↦ notifications@tradereachapp.com
//   Welcome                 ↦ welcome@tradereachapp.com
//   Trial ending            ↦ notifications@tradereachapp.com
//   Payment failed          ↦ billing@tradereachapp.com
//   Monthly performance     ↦ notifications@tradereachapp.com
//   Homeowner confirmation  ↦ noreply@tradereachapp.com
//   Cancellation            ↦ notifications@tradereachapp.com
//   Admin alerts            ↦ alerts@tradereachapp.com
//   Morning digest          ↦ notifications@tradereachapp.com
//
// Reply-to on all contractor-facing emails ↦ support@tradereachapp.com
// ============================================================

import { resend, ADMIN_EMAIL } from './client'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'
import type { Lead, Contractor } from '@/types'
import {
  renderLeadNotification,
  renderWelcome,
  renderTrialEnding,
  renderPaymentFailed,
  renderMonthlyPerformance,
  renderCancellation,
} from './emails'

// Re-export system email functions so routes can import from this file
export {
  sendCreditResetEmail,
  sendLowCreditWarning,
  sendUnusedCreditReminder,
  sendZipTerritoryChangeNotification,
  sendPauseResumedEmail,
  sendWinBackEmail,
  sendUpgradeConfirmationEmail,
  sendElitePlusPerformanceReport,
  sendAccountManagerAlert,
  sendElitePlusWelcomeEmail,
} from './emails/system-emails'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'

const FROM = {
  notifications: process.env.RESEND_FROM_NOTIFICATIONS ?? 'notifications@tradereachapp.com',
  welcome:       process.env.RESEND_FROM_WELCOME       ?? 'welcome@tradereachapp.com',
  billing:       process.env.RESEND_FROM_BILLING       ?? 'billing@tradereachapp.com',
  noreply:       process.env.RESEND_FROM_NOREPLY       ?? 'noreply@tradereachapp.com',
  alerts:        process.env.RESEND_FROM_ALERTS        ?? 'alerts@tradereachapp.com',
}

const SUPPORT_EMAIL = process.env.RESEND_SUPPORT_EMAIL ?? 'support@tradereachapp.com'

function sender(address: string, name = 'TradeReach') {
  return `${name} <${address}>`
}

// ── Lead notification ──────────────────────────────────────────────────────────────

export async function sendLeadNotificationEmail(
  email: string,
  contractor: Contractor,
  lead: Lead
) {
  const firstName = lead.name.split(' ')[0]
  try {
    await resend.emails.send({
      from: sender(FROM.notifications, 'TradeReach Leads'),
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: `New ${lead.niche} Lead in ${lead.zip} — Claim Now`,
      html: renderLeadNotification({
        contractorName: contractor.contact_name ?? contractor.business_name ?? 'there',
        serviceType: lead.niche,
        zip: lead.zip,
        homeownerFirstName: firstName,
        callbackPreference: lead.callback_time ?? 'Anytime',
        claimUrl: `${APP_URL}/dashboard`,
        isElite: contractor.plan_type === 'elite',
      }),
    })
  } catch (err) {
    throw err
  }
}

// ── Admin lead alert ──────────────────────────────────────────────────────────────────

export async function sendAdminLeadAlert(lead: Lead, notifiedCount: number) {
  try {
    await resend.emails.send({
      from: sender(FROM.alerts, 'TradeReach Alerts'),
      to: ADMIN_EMAIL,
      subject: `[Lead] New ${lead.niche} lead in ${lead.zip} — ${notifiedCount} contractors notified`,
      html: `<p><strong>Lead ID:</strong> ${lead.id}</p>
<p><strong>ZIP:</strong> ${lead.zip}</p>
<p><strong>Niche:</strong> ${lead.niche}</p>
<p><strong>Name:</strong> ${lead.name}</p>
<p><strong>Contractors notified:</strong> ${notifiedCount}</p>
<p><a href="${APP_URL}/admin">View in Admin →</a></p>`,
    })
  } catch (err) {
    await logError('email_admin_lead_alert', safeErrorMessage(err), { lead_id: lead.id })
  }
}

// ── Welcome ───────────────────────────────────────────────────────────────────────────

export async function sendContractorWelcome(email: string, contractor: Contractor) {
  const firstName = (contractor.contact_name ?? contractor.business_name ?? 'there').split(' ')[0]
  try {
    await resend.emails.send({
      from: sender(FROM.welcome, 'TradeReach'),
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: "Welcome to TradeReach — You're Almost Live",
      html: renderWelcome({
        firstName,
        setupUrl: `${APP_URL}/onboarding`,
        niche: contractor.niche,
      }),
    })
  } catch (err) {
    await logError('email_contractor_welcome', safeErrorMessage(err), { contractor_id: contractor.id })
  }
}

// ── Cancellation ──────────────────────────────────────────────────────────────────────

export async function sendCancellationEmail(email: string, contractor: Contractor) {
  const firstName = (contractor.contact_name ?? contractor.business_name ?? 'there').split(' ')[0]
  const accessEndsDate = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  try {
    await resend.emails.send({
      from: sender(FROM.notifications, 'TradeReach'),
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Your TradeReach Subscription Has Been Cancelled',
      html: renderCancellation({
        firstName,
        accessEndsDate,
        reactivateUrl: `${APP_URL}/pricing`,
      }),
    })
  } catch (err) {
    await logError('email_cancellation', safeErrorMessage(err), { contractor_id: contractor.id })
  }
}

// ── Payment failed ────────────────────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(email: string, contractor: Contractor) {
  const firstName = (contractor.contact_name ?? contractor.business_name ?? 'there').split(' ')[0]
  try {
    await resend.emails.send({
      from: sender(FROM.billing, 'TradeReach Billing'),
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Action Required — Update Your Billing to Keep Receiving Leads',
      html: renderPaymentFailed({
        firstName,
        billingUrl: `${APP_URL}/dashboard/settings?tab=billing`,
      }),
    })
  } catch (err) {
    await logError('email_payment_failed', safeErrorMessage(err), { contractor_id: contractor.id })
  }
}

// ── Admin cron summary ────────────────────────────────────────────────────────────────

export async function sendAdminCronSummary(
  jobName: string,
  stats: Record<string, number | string>
) {
  try {
    const rows = Object.entries(stats)
      .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#888">${k}</td><td style="padding:4px 8px;color:#fff">${v}</td></tr>`)
      .join('')
    await resend.emails.send({
      from: sender(FROM.alerts, 'TradeReach Cron'),
      to: ADMIN_EMAIL,
      subject: `[Cron] ${jobName} completed`,
      html: `<div style="font-family:monospace;background:#111;color:#e2e8f0;padding:24px;border-radius:8px;">
<h2 style="color:#f97316;margin:0 0 16px">${jobName}</h2>
<table>${rows}</table>
<p style="color:#555;margin:16px 0 0;font-size:12px">Ran at ${new Date().toISOString()}</p>
</div>`,
    })
  } catch (err) {
    await logError('email_admin_cron_summary', safeErrorMessage(err), { job: jobName })
  }
}

// ── Team invitation ───────────────────────────────────────────────────────────────────

export async function sendTeamInvitation(
  email: string,
  recipientName: string,
  inviterName: string,
  token: string,
  businessName: string
) {
  const acceptUrl = `${APP_URL}/accept-invite?token=${token}`
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.06);">
<span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Trade<span style="color:#f97316;">Reach</span></span>
</td></tr>
<tr><td style="padding:40px;">
<h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;">You've been invited</h1>
<p style="margin:0 0 24px;font-size:15px;color:#888;">${inviterName} from <strong style="color:#fff;">${businessName}</strong> has invited you to join their TradeReach team as <strong style="color:#fff;">${recipientName}</strong>.</p>
<p style="margin:0 0 8px;font-size:14px;color:#888;">As a team member, you'll have access to:</p>
<ul style="margin:0 0 28px;padding-left:20px;color:#888;font-size:14px;line-height:1.8;">
<li>Live lead alerts for your service area</li>
<li>The shared leads dashboard</li>
<li>Claim and track leads directly</li>
</ul>
<a href="${acceptUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">Accept Invitation →</a>
<p style="margin:24px 0 0;font-size:12px;color:#555;">This invitation expires in 7 days. If you didn't expect this, you can ignore it.</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
<p style="margin:0;font-size:12px;color:#555;">TradeReach — Connecting contractors with homeowners · <a href="${APP_URL}" style="color:#f97316;text-decoration:none;">tradereachapp.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`

  try {
    await resend.emails.send({
      from: sender(FROM.welcome, 'TradeReach'),
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: `${inviterName} invited you to join their TradeReach team`,
      html,
    })
  } catch (err) {
    await logError('email_team_invitation', safeErrorMessage(err), { email })
  }
}
