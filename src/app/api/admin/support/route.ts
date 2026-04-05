import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'
import { cookies } from 'next/headers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'

function checkAdminAuth() {
  const cookieStore = cookies()
  return cookieStore.get('tr_admin')?.value === process.env.ADMIN_PASSWORD
}

// GET — list tickets with filters
export async function GET(req: NextRequest) {
  if (!checkAdminAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const admin = createAdminClient()
  let q = admin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') q = q.eq('status', status)
  if (priority && priority !== 'all') q = q.eq('priority', priority)

  const { data: tickets } = await q

  // Compute metrics
  const [
    { count: openCount },
    { count: inProgressCount },
    { data: resolvedToday },
  ] = await Promise.all([
    admin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    admin.from('support_tickets')
      .select('created_at, resolved_at')
      .eq('status', 'resolved')
      .gte('resolved_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  // Average response time from resolved tickets
  const { data: resolvedWithTimes } = await admin
    .from('support_tickets')
    .select('created_at, resolved_at')
    .eq('status', 'resolved')
    .not('resolved_at', 'is', null)
    .limit(50)
    .order('resolved_at', { ascending: false })

  let avgResponseHours = null
  if (resolvedWithTimes && resolvedWithTimes.length > 0) {
    const diffs = resolvedWithTimes.map(t => {
      const created = new Date(t.created_at).getTime()
      const resolved = new Date(t.resolved_at!).getTime()
      return (resolved - created) / 3600000
    })
    avgResponseHours = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length * 10) / 10
  }

  return NextResponse.json({
    tickets: tickets ?? [],
    metrics: {
      open: openCount ?? 0,
      in_progress: inProgressCount ?? 0,
      resolved_today: resolvedToday?.length ?? 0,
      avg_response_hours: avgResponseHours,
    },
  })
}

// POST — update ticket status / add notes / mark resolved
export async function POST(req: NextRequest) {
  if (!checkAdminAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action, admin_notes, priority } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: ticket } = await admin.from('support_tickets').select('*').eq('id', id).single()
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const update: Record<string, unknown> = {}

  if (action === 'in_progress') {
    update.status = 'in_progress'
  } else if (action === 'resolve') {
    update.status = 'resolved'
    update.resolved_at = new Date().toISOString()
    update.resolved_by = 'admin'
    if (admin_notes) update.admin_notes = admin_notes
  } else if (action === 'urgent') {
    update.priority = 'urgent'
  } else if (action === 'close') {
    update.status = 'closed'
  } else if (action === 'set_priority' && priority) {
    update.priority = priority
  } else if (action === 'add_notes' && admin_notes) {
    update.admin_notes = admin_notes
  }

  await admin.from('support_tickets').update(update).eq('id', id)

  // If resolved, send contractor notification email (Step 6)
  if (action === 'resolve') {
    const firstName = ticket.contractor_name?.split(' ')[0] ?? 'there'
    const shortId = ticket.id.slice(0, 8).toUpperCase()
    const notes = admin_notes || 'Your issue has been resolved.'

    resend.emails.send({
      from: 'TradeReach Support <support@tradereachapp.com>',
      to: ticket.contractor_email,
      subject: `Your support ticket has been resolved — TradeReach`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${APP_URL}/images/rex-avatar.png" alt="Rex" style="height: 80px; width: auto;" />
          </div>
          <div style="background: white; border-radius: 12px; padding: 28px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px; color: #111827;">Hey ${firstName}, your ticket has been resolved.</h2>
            <p style="color: #374151; line-height: 1.6;">Your support ticket <strong style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${shortId}</strong> has been marked as resolved.</p>
            <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="font-weight: bold; margin: 0 0 8px; color: #166534; font-size: 12px; text-transform: uppercase;">Resolution Notes</p>
              <p style="margin: 0; color: #374151;">${notes}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">If you still need help, just reply to this email or open Rex in your dashboard.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${APP_URL}/dashboard" style="background: #f97316; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Open Rex</a>
            </div>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px;">TradeReach Support · ${APP_URL}</p>
        </div>
      `,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
