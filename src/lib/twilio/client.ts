import twilio from 'twilio'

// Lazy initialization — do NOT throw at module level (would crash all API routes
// that import this file, even if Twilio is only needed for SMS functionality)
let _client: ReturnType<typeof twilio> | null = null

export function getTwilioClient(): ReturnType<typeof twilio> {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!sid || !token) {
      throw new Error(
        'Twilio credentials missing: TWIFIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables.'
      )
    }
    _client = twilio(sid, token)
  }
  return _client
}

// Keep named export for backwards compat — lazily evaluated
export const twilioClient = new Proxy({} as ReturnType<typeof twilio>, {
  get(_target, prop) {
    return (getTwilioClient() as any)[prop]
  },
})

export const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER ?? ''
