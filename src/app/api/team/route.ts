import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendTeamInvitation } from '@/lib/resend/templates'
import { stripe } from '@/lib/stripe/client'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'

const TEAM_MEMBER_PRICE_ID = process.env.STRIPE_TEAM_MEMBER_PRICE_ID ?? ''

// GET /api/team — list team members for current contractor
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: members } = await admin
    .from('team_members')
    .select('*')
    .eq('owner_contractor_id', contractor.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ members: members ?? [] })
}

// POST /api/team — invite a new team member
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('*').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only owner contractors (not team members themselves) can invite
  const { email, name, role = 'member' } = await req.json()
  if (!email || !name) {
    return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
  }

  // Check if already invited / active
  const { data: existing } = await admin
    .from('team_members')
    .select('id, status')
    .eq('owner_contractor_id', contractor.id)
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    if (existing.status === 'active') {
      return NextResponse.json({ error: 'This person is already on your team' }, { status: 409 })
    }
    // Re-send invitation if pending
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 409 })
    }
  }

  // Count active members to determine billing
  const { data: activeMembers } = await admin
    .from('team_members')
    .select('id')
    .eq('owner_contractor_id', contractor.id)
    .eq('status', 'active')

  const activeMemberCount = activeMembers?.length ?? 0
  const isElite = contractor.plan_type === 'elite'
  // Elite gets 1 team member free; everyone else pays from member #1
  const requiresPayment = isElite ? activeMemberCount >= 1 : activeMemberCount >= 0

  let stripeSubscriptionItemId: string | null = null

  if (requiresPayment && contractor.stripe_subscription_id) {
    if (!TEAM_MEMBER_PRICE_ID) {
      return NextResponse.json({ error: 'Team billing not configured' }, { status: 500 })
    }
    try {
      const item = await stripe.subscriptionItems.create({
        subscription: contractor.stripe_subscription_id,
        price: TEAM_MEMBER_PRICE_ID,
        quantity: 1,
        proration_behavior: 'always_invoice',
      })
      stripeSubscriptionItemId = item.id
    } catch (err) {
      await logError('team_stripe_billing', safeErrorMessage(err), { contractor_id: contractor.id })
      return NextResponse.json({ error: 'Billing failed. Check your payment method.' }, { status: 402 })
    }
  } else if (requiresPayment && !contractor.stripe_subscription_id) {
    return NextResponse.json({
      error: 'You need an active subscription to add paid team members',
    }, { status: 402 })
  }

  // Generate invitation token
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  const { data: member, error } = await admin
    .from('team_members')
    .insert({
      owner_contractor_id: contractor.id,
      email: email.toLowerCase(),
      name,
      role,
      status: 'pending',
      invitation_token: token,
      invitation_expires_at: expiresAt,
      stripe_subscription_item_id: stripeSubscriptionItemId,
    })
    .select()
    .single()

  if (error) {
    // Rollback Stripe item if DB insert failed
    if (stripeSubscriptionItemId) {
      await stripe.subscriptionItems.del(stripeSubscriptionItemId).catch(() => {})
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send invitation email
  const inviterName = contractor.contact_name ?? contractor.business_name ?? 'Your team'
  await sendTeamInvitation(email, name, inviterName, token, contractor.business_name ?? 'TradeReach').catch(() => {})

  return NextResponse.json({ member })
}
