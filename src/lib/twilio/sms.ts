// ============================================================
// All SMS Templates — TradeReach (via Twilio)
// ============================================================

import { twilioClient, TWILIO_FROM } from './client'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'
import { createAdminClient } from '@/lib/supabase/server'
import type { Lead, Contractor } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereach.com'

async function sendSMS(
  to: string,
  body: string,
  contractorId?: string,
  leadId?: string
): Promise<boolean> {
  const supabase = createAdminClient()

  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_FROM,
      to,
    })

    // Log success
    await supabase.from('notifications').insert({
      contractor_id: contractorId ?? null,
      lead_id: leadId ?? null,
      type: 'sms',
      status: 'sent',
    })

    return true
  } catch (err) {
    const message = safeErrorMessage(err)

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
    `Claim now: ${APP_URL}/dashboard`

  await sendSMS(contractor.phone, body, contractor.id, lead.id)
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
    `Your quote request was received. A licensed contractor near you will call within 2 hours. Reply STOP to opt out.`

  await sendSMS(phone, body, undefined, lead.id)
}
