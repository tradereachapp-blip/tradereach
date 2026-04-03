import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { structuredError, logError, safeErrorMessage } from '@/lib/utils/error-logger'

function verifyAdmin(request: NextRequest): boolean {
  const key = request.nextUrl.searchParams.get('admin_key') || request.headers.get('x-admin-key')
  return key === process.env.ADMIN_PASSWORD
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) return structuredError('Unauthorized', 401)
  try {
    const body = await request.json()
    const { contractor_id, plan_type } = body
    const admin = createAdminClient()
    const { error } = await admin.from('contractors').update({ plan_type }).eq('id', contractor_id)
    if (error) return structuredError(error.message, 500)
    return Response.json({ success: true })
  } catch (err) {
    await logError('admin_contractor_update', safeErrorMessage(err))
    return structuredError('Failed', 500)
  }
}
