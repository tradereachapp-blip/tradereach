import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

// DELETE /api/team/[id] — remove a team member
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify ownership
  const { data: member } = await admin
    .from('team_members')
    .select('*')
    .eq('id', params.id)
    .eq('owner_contractor_id', contractor.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Cancel Stripe subscription item if exists
  if (member.stripe_subscription_item_id) {
    await stripe.subscriptionItems.del(member.stripe_subscription_item_id, {
      proration_behavior: 'always_invoice',
    }).catch(() => {})
  }

  await admin.from('team_members').delete().eq('id', params.id)

  return NextResponse.json({ success: true })
}

// PATCH /api/team/[id] — update role or notifications
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if (body.role !== undefined) update.role = body.role
  if (body.notifications_enabled !== undefined) update.notifications_enabled = body.notifications_enabled

  const { data: member, error } = await admin
    .from('team_members')
    .update(update)
    .eq('id', params.id)
    .eq('owner_contractor_id', contractor.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member })
}
