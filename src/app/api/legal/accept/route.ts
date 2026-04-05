import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { agreement_type, agreement_version = '1.0' } = await req.json()
  if (!agreement_type) return NextResponse.json({ error: 'agreement_type required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })

  // Get IP and user agent
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'

  const { error } = await admin.from('legal_acceptances').insert({
    contractor_id: contractor.id,
    agreement_type,
    agreement_version,
    accepted_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: userAgent,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// GET — check if current contractor has accepted current version
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ accepted: false })

  const { searchParams } = new URL(req.url)
  const agreementType = searchParams.get('type') ?? 'contractor_tos'
  const version = searchParams.get('version') ?? '1.0'

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ accepted: false })

  const { data } = await admin
    .from('legal_acceptances')
    .select('id, accepted_at')
    .eq('contractor_id', contractor.id)
    .eq('agreement_type', agreementType)
    .eq('agreement_version', version)
    .single()

  return NextResponse.json({ accepted: !!data, accepted_at: data?.accepted_at ?? null })
}
