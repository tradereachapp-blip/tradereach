import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { cookies } from 'next/headers'

function checkAdminAuth() {
  const cookieStore = cookies()
  return cookieStore.get('tr_admin')?.value === process.env.ADMIN_PASSWORD
}

// GET — list credit requests
export async function GET(req: NextRequest) {
  if (!checkAdminAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const admin = createAdminClient()
  const { data: requests } = await admin
    .from('credit_requests')
    .select(`
      *,
      contractors (business_name, contact_name, stripe_customer_id, stripe_subscription_id),
      leads (name, zip, niche, phone)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })

  return NextResponse.json({ requests: requests ?? [] })
}

// POST — approve or deny a credit request
export async function POST(req: NextRequest) {
  if (!checkAdminAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action, reviewer } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  if (!['approve', 'deny'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const admin = createAdminClient()
  const { data: creditReq } = await admin
    .from('credit_requests')
    .select('*, contractors(stripe_customer_id, stripe_subscription_id)')
    .eq('id', id)
    .single()

  if (!creditReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (creditReq.status !== 'pending') return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })

  let stripeCreditId: string | null = null

  if (action === 'approve' && creditReq.credit_amount) {
    const contractor = creditReq.contractors as { stripe_customer_id: string | null }
    if (contractor?.stripe_customer_id) {
      try {
        // Apply Stripe customer balance credit
        const creditNote = await stripe.customers.createBalanceTransaction(
          contractor.stripe_customer_id,
          {
            amount: -Math.round(creditReq.credit_amount * 100), // negative = credit
            currency: 'usd',
            description: `Lead credit: ${creditReq.reason.replace(/_/g, ' ')} — claim ${creditReq.claim_id?.slice(0, 8)}`,
          }
        )
        stripeCreditId = creditNote.id
      } catch (err) {
        console.error('Stripe credit failed:', err)
        return NextResponse.json({ error: 'Stripe credit failed — check logs' }, { status: 500 })
      }
    }
  }

  await admin.from('credit_requests').update({
    status: action === 'approve' ? 'approved' : 'denied',
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewer ?? 'admin',
    stripe_credit_id: stripeCreditId,
  }).eq('id', id)

  return NextResponse.json({ success: true, stripe_credit_id: stripeCreditId })
}
