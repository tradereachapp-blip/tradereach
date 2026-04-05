import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { claim_id, lead_status, notes, job_value, follow_up_date, contact_attempts } = body

  if (!claim_id) return NextResponse.json({ error: 'claim_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })

  const update: Record<string, unknown> = {}
  if (lead_status !== undefined) update.lead_status = lead_status
  if (notes !== undefined) update.notes = notes
  if (job_value !== undefined) update.job_value = job_value ?? null
  if (follow_up_date !== undefined) update.follow_up_date = follow_up_date || null
  if (contact_attempts !== undefined) update.contact_attempts = contact_attempts

  const { error } = await admin
    .from('lead_claims')
    .update(update)
    .eq('id', claim_id)
    .eq('contractor_id', contractor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
