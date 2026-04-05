import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { structuredError } from '@/lib/utils/error-logger'

// GET — get founding member counts for all plans
export async function GET(request: NextRequest) {
  // Admin auth check
  const adminToken = request.headers.get('x-admin-token')
  if (adminToken !== process.env.ADMIN_SECRET) {
    return structuredError('Unauthorized', 401)
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('founding_member_counts')
    .select('*')
    .order('plan_type')

  return Response.json({ counts: data ?? [] })
}

// POST — update founding member max spots
export async function POST(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  if (adminToken !== process.env.ADMIN_SECRET) {
    return structuredError('Unauthorized', 401)
  }

  const body = await request.json()
  const { plan_type, max_spots } = body
  if (!plan_type || max_spots === undefined) {
    return structuredError('plan_type and max_spots required', 400)
  }

  const admin = createAdminClient()
  await admin
    .from('founding_member_counts')
    .update({ max_spots })
    .eq('plan_type', plan_type)

  return Response.json({ success: true, plan_type, max_spots })
}
