import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyMatchingContractors } from '@/lib/utils/notify-contractors'
import { sendHomeownerConfirmationSMS } from '@/lib/twilio/sms'
import { logError, safeErrorMessage, structuredError } from '@/lib/utils/error-logger'
import { NICHES, CALLBACK_TIMES, DUPLICATE_LEAD_WINDOW_HOURS } from '@/lib/config'
import type { Niche } from '@/types'

// ─── In-memory rate limiter (per IP, resets on cold start) ───────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// ─── Bot / spam signal detection ─────────────────────────────────────────────
const BOT_UA_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /scrape/i, /curl/i, /wget/i,
  /python-requests/i, /axios/i, /node-fetch/i, /go-http/i, /java\//i,
  /libwww/i, /httpclient/i, /php\//i, /ruby/i, /perl/i,
]

function looksLikeBot(ua: string | null): boolean {
  if (!ua || ua.length < 20) return true
  return BOT_UA_PATTERNS.some(p => p.test(ua))
}

const SPAM_PATTERNS = [
  /<script/i, /javascript:/i, /on\w+\s*=/i,   // XSS
  /https?:\/\//i,                               // URLs in name/zip fields
  /\b(viagra|casino|loan|crypto|nft|bitcoin)\b/i,
  /(.)\1{6,}/,                                  // repeated characters (aaaaaaaaa)
]

function containsSpam(value: string): boolean {
  return SPAM_PATTERNS.some(p => p.test(value))
}

// Minimum time (ms) a human would take to fill out the form
const MIN_FILL_TIME_MS = 2500

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// Silent fake-success for bots — don't reveal we blocked them
function silentBlock() {
  return Response.json({ success: true, lead_id: 'ok' }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // ── Bot check 1: Origin/Referer must come from our domain ──────────────
    const origin = request.headers.get('origin') ?? ''
    const referer = request.headers.get('referer') ?? ''
    const allowedOrigins = ['https://tradereachapp.com', 'https://www.tradereachapp.com', 'http://localhost:3000']
    if (origin && !allowedOrigins.some(o => origin.startsWith(o))) {
      return silentBlock()
    }

    // ── Bot check 2: User-Agent must look like a real browser ──────────────
    const ua = request.headers.get('user-agent')
    if (looksLikeBot(ua)) {
      return silentBlock()
    }

    // ── Bot check 3: Rate limit per IP ─────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return structuredError('Too many requests. Please try again later.', 429)
    }

    const body = await request.json()
    const { name, phone, zip, niche, description, callback_time, tcpa_consent, _hp, _t } = body

    // ── Bot check 4: Honeypot field must be empty ──────────────────────────
    if (_hp && _hp.length > 0) {
      return silentBlock()
    }

    // ── Bot check 5: Form must have taken at least 2.5 seconds to fill ─────
    if (_t && typeof _t === 'number') {
      const fillTime = Date.now() - _t
      if (fillTime < MIN_FILL_TIME_MS) {
        return silentBlock()
      }
    }

    // ── Bot check 6: Field length limits ──────────────────────────────────
    if ((name?.length ?? 0) > 100) return structuredError('Name is too long', 400)
    if ((phone?.length ?? 0) > 20) return structuredError('Invalid phone number', 400)
    if ((description?.length ?? 0) > 1000) return structuredError('Description is too long', 400)

    // ── Bot check 7: Spam content patterns ────────────────────────────────
    if (containsSpam(name ?? '') || containsSpam(description ?? '')) {
      return silentBlock()
    }

    // ── Server-side field validation ───────────────────────────────────────
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
