import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

const VALID_LEAD_STATUSES = ['available', 'claimed', 'expired', 'rejected'] as const
type LeadStatus = typeof VALID_LEAD_STATUSES[number]

// Header-only auth — never accept key in query params (leaks in server logs & referrer headers)
function verifyAdmin(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key')
  const secret = process.env.ADMIN_PASSWORD
  if (!key || !secret || key.length < 8) return false
  // Constant-time comparison prevents timing attacks
  if (key.length !== secret.length) return false
  let diff = 0
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ secret.charCodeAt(i)
  return diff === 0
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) return structuredError('Unauthorized', 401)
  try {
    const body = await request.json()
    const { lead_id, status } = body

    if (!lead_id || typeof lead_id !== 'string' || lead_id.length > 100) {
      return structuredError('Invalid lead_id', 400)
    }
    if (!status || !VALID_LEAD_STATUSES.includes(status as LeadStatus)) {
      return structuredError(`status must be one of: ${VALID_LEAD_STATUSES.join(', ')}`, 400)
    }

    const admin = createAdminClient()
    const { error } = await admin.from('leads').update({ status }).eq('id', lead_id)
    if (error) return structuredError(error.message, 500)
    return Response.json({ success: true })
  } catch (err) {
    await logError('admin_lead_update', safeErrorMessage(err))
    return structuredError('Failed', 500)
  }
}
