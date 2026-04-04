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

const SUPPORT_EMAIL = process.env.RESEND_SUPPORT_EMAIL ?? 'support@tradereachapp.com'

function sender(address, name = 'TradeReach') {
  return name + ' <' + address + '>'
}

export async function sendLeadNotificationEmail(email, contractor, lead) {
  const firstName = lead.name.split(' ')[0]
  try {
    await resend.emails.send({ from: sender(FROM.notifications, 'TradeReach Leads'), to: email, replyTo: SUPPORT_EMAIL, subject: 'New ' + lead.niche + ' Lead in ' + lead.zip + ' — Claim Now', html: renderLeadNotification({ contractorName: contractor.contact_name ?? contractor.business_name ?? 'there', serviceType: lead.niche, zip: lead.zip, homeownerFirstName: firstName, callbackPreference: lead.callback_time ?? 'Anytime', claimUrl: APP_URL + '/dashboard', isElite: contractor.plan === 'elite' }) })
  } catch (err) { throw err }
}

export async function sendContractorWelcome(email, contractor) {
  const firstName = (contractor.contact_name ?? contractor.business_name ?? 'there').split(' ')[0]
  try { await resend.emails.send({ from: sender(FROM.welcome, 'TradeReach'), to: email, replyTo: SUPPORT_EMAIL, subject: 'Welcome to TradeReach — You\'re Almost Live', html: renderWelcome({ firstName, setupUrl: APP_URL + '/onboarding', niche: contractor.niche }) }) } catch (err) { await logError('email_contractor_welcome', safeErrorMessage(err), { contractor_id: contractor.id }) }
}
