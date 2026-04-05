import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { email, name } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('deletion_requests').insert({ email: email.toLowerCase(), name: name ?? null })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
