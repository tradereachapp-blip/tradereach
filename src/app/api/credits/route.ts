import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/credits — submit a credit request
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { claim_id, lead_id, reason, description } = await req.json()
  if (!claim_id || !reason) return NextResponse.json({ error: 'claim_id and reason required' }, { status: 400 })

  const validReasons = ['duplicate_lead', 'disconnected_phone', 'homeowner_did_not_submit']
  if (!validReasons.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify contractor owns this claim
  const { data: claim } = await admin
    .from('lead_claims')
    .select('id, amount_charged')
    .eq('id', claim_id)
    .eq('contractor_id', contractor.id)
    .single()
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 })

  // Check for existing pending/approved request for this claim
  const { data: existing } = await admin
    .from('credit_requests')
    .select('id, status')
    .eq('claim_id', claim_id)
    .in('status', ['pending', 'approved'])
    .single()
  if (existing) {
    return NextResponse.json({ error: 'A credit request already exists for this lead' }, { status: 409 })
  }

  const { data: creditReq, error } = await admin.from('credit_requests').insert({
    contractor_id: contractor.id,
    claim_id,
    lead_id: lead_id ?? null,
    reason,
    description: description ?? null,
    status: 'pending',
    credit_amount: claim.amount_charged ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credit_request: creditReq })
}
