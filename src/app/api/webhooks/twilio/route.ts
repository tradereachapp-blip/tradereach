import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import twilio from 'twilio'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER!

// Twilio inbound SMS webhook — handles STOP/START opt-out/opt-in
export async function POST(req: NextRequest) {
  // Validate Twilio signature
  const sig = req.headers.get('x-twilio-signature') ?? ''
  const url = process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/twilio'
  const body = await req.text()

  // Parse URL-encoded body
  const params = Object.fromEntries(new URLSearchParams(body))

  try {
    const isValid = twilio.validateRequest(TWILIO_AUTH_TOKEN, sig, url, params)
    if (!isValid) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  } catch {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const fromNumber = params.From ?? ''
  const messageBody = (params.Body ?? '').trim().toUpperCase()

  const admin = createAdminClient()

  // Find leads by phone (normalize: strip non-digits, prepend +1 if needed)
  const digits = fromNumber.replace(/\D/g, '')
  const e164 = digits.startsWith('1') && digits.length === 11
    ? `+${digits}`
    : digits.length === 10 ? `+1${digits}` : fromNumber

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

  if (messageBody === 'STOP' || messageBody === 'STOPALL' || messageBody === 'UNSUBSCRIBE' || messageBody === 'CANCEL' || messageBody === 'END' || messageBody === 'QUIT') {
    // Opt out — mark all matching leads as opted out
    await admin
      .from('leads')
      .update({ opted_out: true, opted_out_at: new Date().toISOString() })
      .eq('phone', e164)

    // Also try matching without country code
    await admin
      .from('leads')
      .update({ opted_out: true, opted_out_at: new Date().toISOString() })
      .like('phone', `%${digits.slice(-10)}`)

    // Send confirmation
    try {
      await client.messages.create({
        body: 'You have been opted out of TradeReach contractor contacts. Reply START to opt back in.',
        from: TWILIO_PHONE,
        to: fromNumber,
      })
    } catch {}

    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  if (messageBody === 'START' || messageBody === 'YES' || messageBody === 'UNSTOP') {
    // Opt back in
    await admin
      .from('leads')
      .update({ opted_out: false, opted_out_at: null })
      .eq('phone', e164)

    await admin
      .from('leads')
      .update({ opted_out: false, opted_out_at: null })
      .like('phone', `%${digits.slice(-10)}`)

    try {
      await client.messages.create({
        body: 'You have been opted back in to TradeReach contractor contacts. Reply STOP at any time to opt out again.',
        from: TWILIO_PHONE,
        to: fromNumber,
      })
    } catch {}

    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Any other inbound message — empty response
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
