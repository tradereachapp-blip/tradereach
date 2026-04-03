import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyMatchingContractors } from '@/lib/utils/notify-contractors'
import { sendHomeownerConfirmationSMS } from '@/lib/twilio/sms'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { NICHES, CALLBACK_TIMES, DUPLICATE_LEAD_WINDOW_HOURS } from '@/lib/config'
import type { Niche } from '@/types'

// Validate phone number format
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone)
  return digits.length === 10 || digits.length === 11
}

function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim())
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, zip, niche, description, callback_time, tcpa_consent } = body

    // Server-side validation
    if (!name?.trim()) return structuredError('Name is required', 400)
    if (!phone?.trim() || !isValidPhone(phone)) return structuredError('Valid phone number is required', 400)
    if (!zip?.trim() || !isValidZip(zip)) return structuredError('Valid 5-digit ZIP code is required', 400)
    if (!niche || !NICHES.includes(niche as Niche)) return structuredError('Valid service type is required', 400)
    if (!tcpa_consent) return structuredError('TCPA consent is required', 400)

    const normalizedPhone = normalizePhone(phone)
    const admin = createAdminClient()

    // Duplicate detection: same phone within 24 hours
    const cutoff = new Date(Date.now() - DUPLICATE_LEAD_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
    const { data: existing } = await admin
      .from('leads')
      .select('id, created_at')
      .gte('created_at', cutoff)
      .eq('phone', normalizedPhone)
      .limit(1)

    if (existing && existing.length > 0) {
      return Response.json(
        {
          success: false,
          duplicate: true,
          message: 'It looks like you already submitted a request recently. A contractor will be in touch soon!',
        },
        { status: 409 }
      )
    }

    // Save lead
    const { data: lead, error: insertError } = await admin
      .from('leads')
      .insert({
        name: name.trim(),
        phone: normalizedPhone,
        zip: zip.trim(),
        niche,
        description: description?.trim() || null,
        callback_time: callback_time || null,
        tcpa_consent: true,
        status: 'available',
      })
      .select()
      .single()

    if (insertError || !lead) {
      await logError('lead_insert_failed', insertError?.message ?? 'Unknown', { body })
      return structuredError('Failed to submit your request. Please try again.', 500)
    }

    // Trigger notifications (non-blocking — errors are logged internally)
    notifyMatchingContractors(lead).catch((err) =>
      logError('notify_trigger_failed', safeErrorMessage(err), { lead_id: lead.id })
    )

    // Send homeowner SMS confirmation (non-blocking)
    if (normalizedPhone) {
      const e164Phone = normalizedPhone.length === 11
        ? `+${normalizedPhone}`
        : `+1${normalizedPhone}`
      sendHomeownerConfirmationSMS(e164Phone, lead).catch(() => null)
    }

    return Response.json({
      success: true,
      lead_id: lead.id,
      message: 'Your request has been submitted! A contractor will contact you shortly.',
    })
  } catch (err) {
    await logError('lead_submit_error', safeErrorMessage(err))
    return structuredError('Something went wrong. Please try again.', 500)
  }
}
