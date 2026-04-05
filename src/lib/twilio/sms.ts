// ============================================================
// All SMS Templates — TradeReach (via Twilio)
// ============================================================

import { twilioClient, TWILIO_FROM } from './client'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'
import { createAdminClient } from '@/lib/supabase/server'
import type { Lead, Contractor } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'

/**
 * Normalize any US phone number to E.164 format (+1XXXXXXXXXX).
 * Accepts: (555) 123-4567 | 555-123-4567 | 5551234567 | +15551234567
 * Returns null if the number can't be normalized to a valid US number.
 */
function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null
  // Strip everything except digits and leading +
  const digits = raw.replace(/\D/g, '')
  // Handle 10-digit US numbers
  if (digits.length === 10) return `+1${digits}`
  // Handle 11-digit numbers starting with 1
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  // Already E.164 with +
  if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`
  return null
}

async function sendSMS(
  to: string,
  body: string,
  contractorId?: string,
  leadId?: string
): Promise<boolean> {
  const supabase = createAdminClient()

  // Pre-flight: verify Twilio is configured
  if (!TWILIO_FROM) {
    const msg = 'SMS skipped: TWILIO_PHONE_NUMBER env var is not set. Add it to your Vercel environment variables.'
    await supabase.from('notifications').insert({
      contractor_id: contractorId ?? null,
      lead_id: leadId ?? null,
      type: 'sms',
      status: 'failed',
      error_message: msg,
    })
    await logError('sms_config_missing', msg, { contractor_id: contractorId, lead_id: leadId })
    return false
  }

  // Pre-flight: validate and normalize phone number to E.164
  const e164 = toE164(to)
  if (!e164) {
    const msg = `SMS skipped: phone number "${to}" could not be converted to E.164 format. Store phone numbers as 10-digit US numbers.`
    await supabase.from('notifications').insert({
      contractor_id: contractorId ?? null,
      lead_id: leadId ?? null,
      type: 'sms',
      status: 'failed',
      error_message: msg,
    })
    await logError('sms_invalid_phone', msg, { to, contractor_id: contractorId, lead_id: leadId })
    return false
  }

  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_FROM,
      to: e164,
    })

    // Log success
    await supabase.from('notifications').insert({
      contractor_id: contractorId ?? null,
      lead_id: leadId ?? null,
      type: 'sms',
      status: 'sent',
    })

    return true
  } catch (err: unknown) {
    // Extract Twilio-specific error code and message for precise diagnostics
    const twilioCode = (err as { code?: number })?.code
    const twilioStatus = (err as { status?: number })?.status
    const baseMessage = safeErrorMessage(err)
    let message = baseMessage

    if (twilioCode === 21608) {
      message = `Twilio error 21608 — Trial account restriction: recipient number is not verified. ` +
        `Verify the number at twilio.com/user/account/phone-numbers/verified OR upgrade your Twilio account. Raw: ${baseMessage}`
    } else if (twilioCode === 21211) {
      message = `Twilio error 21211 — Invalid 'To' phone number. Raw: ${baseMessage}`
    } else if (twilioCode === 20003) {
      message = `Twilio error 20003 — Authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN. Raw: ${baseMessage}`
    } else if (twilioCode) {
      message = `Twilio error ${twilioCode} (HTTP ${twilioStatus ?? '?'}): ${baseMessage}`
    }

    // Log failure — never crash the caller
    await supabase.from('notifications').insert({
      contractor_id: contractorId ?? null,
      lead_id: leadId ?? null,
      type: 'sms',
      status: 'failed',
      error_message: message,
    })

    await logError('sms_send_failed', message, {
      to,
      twilio_error_code: twilioCode ?? null,
      contractor_id: contractorId,
      lead_id: leadId,
    })

    return false
  }
}

// ----------------------------------------------------------------
// 1. Contractor New Lead Alert
// ----------------------------------------------------------------
export async function sendLeadAlertSMS(
  contractor: Contractor,
  lead: Lead
): Promise<void> {
  const firstName = lead.name.split(' ')[0]
  const body =
    `TradeReach: New ${lead.niche} lead in ${lead.zip}. ` +
    `${firstName} needs a quote. ` +
    `Claim now: ${APP_URL}/dashboard?tab=available-leads`

  // Use dedicated SMS notification number if set, otherwise fall back to business phone
  const toPhone = contractor.sms_notification_phone || contractor.phone
  await sendSMS(toPhone, body, contractor.id, lead.id)
}

// ----------------------------------------------------------------
// 2. Trial Ending Tomorrow
// ----------------------------------------------------------------
export async function sendTrialEndingSMS(contractor: Contractor): Promise<void> {
  const body =
    `TradeReach: Your free trial ends tomorrow. ` +
    `Log in to update billing and keep your leads coming: ${APP_URL}/settings`

  await sendSMS(contractor.phone, body, contractor.id)
}

// ----------------------------------------------------------------
// 3. Payment Failed
// ----------------------------------------------------------------
export async function sendPaymentFailedSMS(contractor: Contractor): Promise<void> {
  const body =
    `TradeReach: Payment failed on your account. ` +
    `Update billing to avoid losing access: ${APP_URL}/settings`

  await sendSMS(contractor.phone, body, contractor.id)
}

// ----------------------------------------------------------------
// 4. Homeowner Confirmation SMS — no brand name in body
// ----------------------------------------------------------------
export async function sendHomeownerConfirmationSMS(
  phone: string,
  lead: Lead
): Promise<void> {
  const body =
    `Your quote request was received. A trusted local contractor will call you within 2 hours. Reply STOP to opt out.`

  await sendSMS(phone, body, undefined, lead.id)
}
