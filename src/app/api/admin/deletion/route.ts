import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

function checkAdminAuth() {
  const cookieStore = cookies()
  return cookieStore.get('tr_admin')?.value === process.env.ADMIN_PASSWORD
}

// GET — list deletion requests
export async function GET() {
  if (!checkAdminAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin
    .from('deletion_requests')
    .select('*')
    .order('created_at', { ascending: false })
  return NextResponse.json({ requests: data ?? [] })
}

// POST — approve deletion (anonymize records)
export async function POST(req: NextRequest) {
  if (!checkAdminAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: request } = await admin
    .from('deletion_requests').select('*').eq('id', id).single()
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'approve') {
    const email = request.email

    // Anonymize leads matching this email
    await admin
      .from('leads')
      .update({ name: 'DELETED', phone: '0000000000' })
      .eq('email', email)

    // Anonymize contractor if exists
    const { data: contractor } = await admin
      .from('contractors')
      .select('user_id')
      .eq('user_id', (await admin.auth.admin.getUserByEmail(email))?.data?.user?.id ?? '')
      .single()

    if (contractor) {
      // Disable the user account but don't delete (needed for financial records)
      const { data: userResult } = await admin.auth.admin.getUserByEmail(email)
      if (userResult?.user?.id) {
        await admin.auth.admin.updateUserById(userResult.user.id, {
          email: `deleted-${userResult.user.id}@deleted.com`,
        })
      }
    }

    await admin.from('deletion_requests').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', id)
  } else {
    await admin.from('deletion_requests').update({ status: 'denied' }).eq('id', id)
  }

  return NextResponse.json({ success: true })
}
