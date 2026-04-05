import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@tradereachapp.com'
const SUPPORT_PHONE = process.env.SUPPORT_PHONE ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereachapp.com'

// Priority detection from message content
function detectPriority(subject: string, message: string): 'urgent' | 'high' | 'normal' | 'low' {
  const text = `${subject} ${message}`.toLowerCase()
  if (/payment failed|cannot access|locked out|lost leads|account suspended|cannot login|can.t login/.test(text)) return 'urgent'
  if (/billing|refund|overcharged|technical error|leads not showing|not working|broken|error|glitch/.test(text)) return 'high'
  if (/feedback|suggestion|compliment|great|love|appreciate/.test(text)) return 'low'
  return 'normal'
}

// POST /api/support — create a support ticket from Rex escalation
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, message, conversation_context } = await req.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get contractor details
  const { data: contractor } = await admin
    .from('contractors')
    .select('id, business_name, contact_name, phone, plan_type')
    .eq('user_id', user.id)
    .single()
  if (!contractor) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })

  const contractorEmail = user.email ?? ''
  const priority = detectPriority(subject, message)
  const firstName = contractor.contact_name?.split(' ')[0] ?? 'there'

  // Insert ticket
  const { data: ticket, error: ticketError } = await admin
    .from('support_tickets')
    .insert({
      contractor_id: contractor.id,
      contractor_name: contractor.business_name,
      contractor_email: contractorEmail,
      contractor_phone: contractor.phone ?? null,
      plan_type: contractor.plan_type,
      subject: subject.trim(),
      message: message.trim(),
      source: 'rex',
      status: 'open',
      priority,
      conversation_context: conversation_context ?? null,
    })
    .select('id')
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: ticketError?.message ?? 'Failed to create ticket' }, { status: 500 })
  }

  const ticketId = ticket.id
  const shortId = ticketId.slice(0, 8).toUpperCase()
  const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })

  // Build conversation context snippet
  const contextSnippet = Array.isArray(conversation_context)
    ? conversation_context
        .slice(-5)
        .map((m: { role: string; content: string }) => `[${m.role}]: ${m.content}`)
        .join('\n')
    : 'No conversation context provided.'

  // Email 1: Notify support team
  const priorityLabel = priority.toUpperCase()
  resend.emails.send({
    from: 'Rex <noreply@tradereachapp.com>',
    to: SUPPORT_EMAIL,
    replyTo: contractorEmail,
    subject: `[${priorityLabel}] New Support Ticket — ${contractor.plan_type?.toUpperCase()} — ${contractor.business_name} — ${subject.trim()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #111827; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #f97316;">New Support Ticket via Rex</h2>
          <p style="color: #9ca3af; margin: 4px 0 0;">Priority: <strong style="color: ${priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f97316' : priority === 'low' ? '#6b7280' : '#3b82f6'}">${priorityLabel}</strong></p>
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <tr style="background: #f3f4f6;"><td style="padding: 10px 16px; font-weight: bold; width: 140px;">Contractor</td><td style="padding: 10px 16px;">${contractor.business_name}</td></tr>
          <tr><td style="padding: 10px 16px; font-weight: bold; background: #f9fafb;">Plan</td><td style="padding: 10px 16px;">${contractor.plan_type}</td></tr>
          <tr style="background: #f3f4f6;"><td style="padding: 10px 16px; font-weight: bold;">Email</td><td style="padding: 10px 16px;"><a href="mailto:${contractorEmail}">${contractorEmail}</a></td></tr>
          <tr><td style="padding: 10px 16px; font-weight: bold; background: #f9fafb;">Phone</td><td style="padding: 10px 16px;">${contractor.phone ?? '—'}</td></tr>
          <tr style="background: #f3f4f6;"><td style="padding: 10px 16px; font-weight: bold;">Submitted</td><td style="padding: 10px 16px;">${submittedAt} ET</td></tr>
          <tr><td style="padding: 10px 16px; font-weight: bold; background: #f9fafb;">Ticket ID</td><td style="padding: 10px 16px; font-family: monospace;">${shortId} (${ticketId})</td></tr>
        </table>
        <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #f97316;">
          <p style="font-weight: bold; margin: 0 0 8px; color: #111827;">Subject</p>
          <p style="margin: 0; color: #374151;">${subject.trim()}</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <p style="font-weight: bold; margin: 0 0 8px; color: #111827;">Message</p>
          <p style="margin: 0; color: #374151; white-space: pre-line;">${message.trim()}</p>
        </div>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="font-weight: bold; margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Conversation Context (last 5 messages)</p>
          <pre style="font-size: 12px; color: #374151; white-space: pre-wrap; margin: 0;">${contextSnippet}</pre>
        </div>
        <p style="color: #6b7280; font-size: 12px;">Reply directly to this email to respond to the contractor at ${contractorEmail}.</p>
      </div>
    `,
  }).catch(() => {})

  // Email 2: Confirmation to contractor
  resend.emails.send({
    from: 'TradeReach Support <support@tradereachapp.com>',
    to: contractorEmail,
    subject: `We received your message — TradeReach Support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${APP_URL}/images/rex-avatar.png" alt="Rex" style="height: 80px; width: auto;" />
        </div>
        <div style="background: white; border-radius: 12px; padding: 28px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 16px; color: #111827;">Hey ${firstName}, we got your message.</h2>
          <p style="color: #374151; line-height: 1.6;">Someone from our team will follow up within <strong>24 hours</strong> during business hours.</p>
          <p style="color: #374151;">Your ticket ID is <strong style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${shortId}</strong> — reference this if you follow up.</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
            <p style="font-weight: bold; margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Message Received</p>
            <p style="margin: 0; color: #374151; white-space: pre-line;">${message.trim()}</p>
          </div>
          ${SUPPORT_PHONE ? `<p style="color: #6b7280; font-size: 14px;">If this is urgent, call or text us at <a href="tel:${SUPPORT_PHONE}" style="color: #f97316;">${SUPPORT_PHONE}</a>.</p>` : ''}
          <div style="text-align: center; margin-top: 24px;">
            <a href="${APP_URL}/dashboard" style="background: #f97316; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View My Dashboard</a>
          </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px;">TradeReach Support · ${APP_URL}</p>
      </div>
    `,
  }).catch(() => {})

  return NextResponse.json({ success: true, ticket_id: ticketId, short_id: shortId, priority })
}

// GET /api/support — get contractor's own tickets
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: contractor } = await admin.from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) return NextResponse.json({ tickets: [] })

  const { data: tickets } = await admin
    .from('support_tickets')
    .select('id, created_at, subject, status, priority, resolved_at')
    .eq('contractor_id', contractor.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ tickets: tickets ?? [] })
}
