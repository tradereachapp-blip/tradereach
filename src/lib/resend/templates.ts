// ============================================================
// TradeReach — All Transactional Email Senders
//
// From addresses per email type:
//   Lead notifications      → notifications@tradereachapp.com
//   Welcome                 → welcome@tradereachapp.com
//   Trial ending            → notifications@tradereachapp.com
//   Payment failed          → billing@tradereachapp.com
//   Monthly performance     → notifications@tradereachapp.com
//   Homeowner confirmation  → noreply@tradereachapp.com
//   Cancellation            → notifications@tradereachapp.com
//   Admin alerts            → alerts@tradereachapp.com
//   Morning digest          → notifications@tradereachapp.com
//
// Reply-to on all contractor-facing emails → support@tradereachapp.com
// ============================================================

import { resend, ADMIN_EMAIL } from './client'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'
import type { Lead, Contractor } from '@/types'
import { createAdminClient } from '@/lib/supabase/server'
import { PRICING } from '@/lib/pricing'

import {
  renderLeadNotification,
  renderWelcome,
  renderTrialEnding,
  renderPaymentFailed,
  renderMonthlyPerformance,
  renderHomeownerConfirmation,
  renderCancellation,
} from './emails'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'

const FROM = {
  notifications: process.env.RESEND_FROM_NOTIFICATIONS ?? 'notifications@tradereachapp.com',
  welcome:       process.env.RESEND_FROM_WELCOME       ?? 'welcome@tradereachapp.com',
  billing:       process.env.RESEND_FROM_BILLING       ?? 'billing@tradereachapp.com',
  noreply:       process.env.RESEND_FROM_NOREPLY       ?? 'noreply@tradereachapp.com',
  alerts:        process.env.RESEND_FROM_ALERTS        ?? 'alerts@tradereachapp.com',
}

const SUPPORT_EMAIL = 'support@tradereachapp.com'

// ================================================================
// 1. Welcome Email
// ================================================================
export async function sendWelcome(contractor: Contractor): Promise<void> {
  try {
    const { firstName } = getNames(contractor)
    const html = renderWelcome({ firstName, dashboardUrl: `${APP_URL}/dashboard` })
    await resend.emails.send({
      from: FROM.welcome,
      to: contractor.user_email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Welcome to TradeReach',
      html,
    })
  } catch (err: unknown) {
    const msg = safeErrorMessage(err)
    await logError('email_welcome_failed', `Failed to send welcome email to ${contractor.user_email}: ${msg}`, { contractor_id: contractor.id })
  }
}

// ================================================================
// 2. Lead Notification Email
// ================================================================
export async function sendLeadNotification(
  contractor: Contractor,
  lead: Lead
): Promise<void> {
  try {
    const recipientEmail = contractor.notification_email || contractor.user_email
    const { firstName } = getNames(contractor)
    const leadUrl = `${APP_URL}/dashboard?lead_id=${lead.id}`    const html = renderLeadNotification({
      firstName,
      homeownerName: lead.name,
      niche: lead.niche,
      zip: lead.zip,
      callbackPreference: lead.callback_time,
      claimUrl: leadUrl,
    })
    await resend.emails.send({
      from: FROM.notifications,
      to: recipientEmail,
      replyTo: SUPPORT_EMAIL,
      subject: `New ${lead.niche} Lead in ${lead.zip}`,
      html,
    })
  } catch (err: unknown) {
    const msg = safeErrorMessage(err)
    await logError('email_lead_notification_failed', `Failed to send lead notification to ${contractor.user_email}: ${msg}`, {
      contractor_id: contractor.id,
      lead_id: lead.id,
    })
  }
}

// ================================================================
// 3. Trial Ending in 24 Hours
// ================================================================
export async function sendTrialEnding(contractor: Contractor): Promise<void> {
  try {
    const { firstName } = getNames(contractor)
    const html = renderTrialEnding({
      firstName,
      activateUrl: `${APP_URL}/onboarding`,
      proPriceMonthly: PRICING.pro.monthly,
      elitePriceMonthly: PRICING.elite.monthly,
    })
    await resend.emails.send({
      from: FROM.notifications,
      to: contractor.user_email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Your Free Trial Ends Tomorrow — Don\'t Lose Your Leads',
      html,
    })
  } catch (err: unknown) {
    const msg = safeErrorMessage(err)
    await logError('email_trial_ending_failed', `Failed to send trial ending email to ${contractor.user_email}: ${msg}`, { contractor_id: contractor.id })
  }
}

// ================================================================
// 4. Payment Failed
// ================================================================
export async function sendPaymentFailed(contractor: Contractor): Promise<void> {
  try {
    const { firstName } = getNames(contractor)
    const billingUrl = `${APP_URL}/settings`
    const html = renderPaymentFailed({ firstName, billingUrl })
    await resend.emails.send({
      from: FROM.billing,
      to: contractor.user_email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Action Required — Update Your Billing to Keep Receiving Leads',
      html,
    })
  } catch (err: unknown) {
    const msg = safeErrorMessage(err)
    await logError('email_payment_failed_failed', `Failed to send payment failed email to ${contractor.user_email}: ${msg}`, { contractor_id: contractor.id })
  }
}

// ================================================================
// 5. Monthly Performance Report
// ================================================================
export async function sendMonthlyPerformance(
  contractor: Contractor,
  stats: {
    leadsReceived: number
    leadsClaimed: number
    responseRate: string
    estimatedRevenue: string
    month: string
  }
): Promise<void> {
  try {
    const { firstName } = getNames(contractor)
    const recipientEmail = contractor.notification_email || contractor.user_email
    const html = renderMonthlyPerformance({
      firstName,
      month: stats.month,
      leadsReceived: stats.leadsReceived,
      leadsClaimed: stats.leadsClaimed,
      responseRate: stats.responseRate,
      estimatedRevenue: stats.estimatedRevenue,
      dashboardUrl: `${APP_URL}/dashboard`,
    })
    await resend.emails.send({
      from: FROM.notifications,
      to: recipientEmail,
      replyTo: SUPPORT_EMAIL,
      subject: `Your TradeReach Report — ${stats.month}`,
      html,
    })
  } catch (err: unknown) {
    const msg = safeErrorMessage(err)
    await logError('email_monthly_perf_failed', `Failed to send monthly performance email to ${contractor.user_email}: ${msg}`, { contractor_id: contractor.id })
  }
}

// ================================================================
// 6. Homeowner Quote Confirmation (No Brand Name In Body)
// ================================================================
export async function sendHomeownerConfirmation(
  recipientPhone: string,
  lead: Lead,
  supportPhone?: string
): Promise<void> {
  try {
    const { firstName } = getNames(lead)
    const html = renderHomeownerConfirmation({
      firstName,
      serviceType: lead.niche,
      zip: lead.zip,
      callbackPreference: lead.callback_time || 'Not specified',
      supportPhone,
    })

    // Homeowner emails go to the lead's email if available, fallback to contractor support email for now
    // In production, extract lead.email from lead data
    const recipientEmail = (lead as any).email || ADMIN_EMAIL

    await resend.emails.send({
      from: FROM.noreply,
      to: recipientEmail,
      subject: 'Your Quote Request Was Received',
      html,
    })
  } catch (err: unknown) {
    const msg = safeErrorMessage(err)
    await logError('email_homeowner_confirm_failed', `Failed to send homeowner confirmation: ${msg}`, { lead_id: lead.id })
  }
}

// ================================================================
// 7. Subscription Cancellation
// ================================================================
export async function sendCancellation(
  contractor: Contractor,
  accessEndsDate: string
): Promise<void> {
  try {
    const { firstName } = getNames(contractor)
    const reactivateUrl = `${APP_URL}/onboarding`
    const html = renderCancellation({ firstName, accessEndsDate, reactivateUrl })
    await resend.emails.send({
      from: FROM.notifications,
      to: contractor.user_email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Your TradeReach Subscription Has Been Cancelled',
      html,
    })
  } catch (err: unknown) {
    const msg = safeErrorMessage(err)
    await logError('email_cancellation_failed', `Failed to send cancellation email to ${contractor.user_email}: ${msg}`, { contractor_id: contractor.id })
  }
}

// ================================================================
// Helper: Extract Name
// ================================================================
function getNames(obj: any): { firstName: string; lastName?: string } {
  const name = obj.contact_name || obj.name || 'there'
  const [firstName, ...rest] = name.split(' ')
  return { firstName: firstName || 'Friend', lastName: rest.join(' ') || undefined }
}
