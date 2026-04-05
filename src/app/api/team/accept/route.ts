import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/team/accept — accept a team invitation
// Body: { token: string }
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const admin = createAdminClient()

  // Look up invitation
  const { data: member } = await admin
    .from('team_members')
    .select('*')
    .eq('invitation_token', token)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Invalid invitation link' }, { status: 404 })
  }

  if (member.status === 'active') {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 409 })
  }

  if (member.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 410 })
  }

  // Check expiry
  if (member.invitation_expires_at && new Date(member.invitation_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired. Ask your team owner to resend it.' }, { status: 410 })
  }

  // Verify email matches (case-insensitive)
  if (member.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({
      error: `This invitation was sent to ${member.email}. Please sign in with that email address.`
    }, { status: 403 })
  }

  // Check if user already belongs to another team
  const { data: existingMembership } = await admin
    .from('team_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (existingMembership && existingMembership.id !== member.id) {
    return NextResponse.json({
      error: 'You are already a member of another team. Contact support to transfer.'
    }, { status: 409 })
  }

  // Accept the invitation
  const { error } = await admin
    .from('team_members')
    .update({
      user_id: user.id,
      status: 'active',
      invitation_token: null, // Invalidate token after use
      invitation_expires_at: null,
    })
    .eq('id', member.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
