import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

const VALID_PLAN_TYPES = ['none', 'pro', 'elite', 'pay_per_lead'] as const
type PlanType = typeof VALID_PLAN_TYPES[number]

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
    const { contractor_id, plan_type } = body

    if (!contractor_id || typeof contractor_id !== 'string' || contractor_id.length > 100) {
      return structuredError('Invalid contractor_id', 400)
    }
    if (!plan_type || !VALID_PLAN_TYPES.includes(plan_type as PlanType)) {
      return structuredError(`plan_type must be one of: ${VALID_PLAN_TYPES.join(', ')}`, 400)
    }

    const admin = createAdminClient()
    const { error } = await admin.from('contractors').update({ plan_type }).eq('id', contractor_id)
    if (error) return structuredError(error.message, 500)
    return Response.json({ success: true })
  } catch (err) {
    await logError('admin_contractor_update', safeErrorMessage(err))
    return structuredError('Failed', 500)
  }
}
