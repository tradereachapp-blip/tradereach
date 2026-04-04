// ─── Chat Leads Capture Route ─────────────────────────────────────────────────
// Saves contractor contact info captured through chatbot and notifies admin.

import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/resend/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { name, email, phone, interest, source, sessionId } = body

    const admin = createAdminClient()

    // Save to chat_leads table
    const { data: lead } = await admin.from('chat_leads').insert({
      session_id: sessionId,
      contractor_id: user?.id ?? null,
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      interest: interest ?? null,
      source: source ?? 'support',
      status: 'new',
    }).select('id').single()

    // Also save to support_escalations if this is an escalation
    if (source === 'cancellation_save' || source === 'support') {
      await admin.from('support_escalations').upsert({
        session_id: sessionId,
        contractor_id: user?.id ?? null,
        contractor_email: email ?? null,
        contractor_phone: phone ?? null,
        issue_summary: interest ?? 'Contact captured via chatbot',
        issue_category: source === 'cancellation_save' ? 'cancellation' : 'other',
        priority: source === 'cancellation_save' ? 'high' : 'normal',
        status: 'open',
      })
    }

    // Notify admin via email
    const label = source === 'cancellation_save' ? '🚨 CANCELLATION RISK' :
      source === 'new_contractor_interest' ? '🟢 NEW CONTRACTOR LEAD' :
      source === 'upgrade_interest' ? '⬆️ UPGRADE INTEREST' : '💬 CHAT LEAD'

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `${label} — TradeReach Chatbot`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">${label}</h2>
          <p><strong>Name:</strong> ${name ?? 'Not provided'}</p>
          <p><strong>Email:</strong> ${email ?? 'Not provided'}</p>
          <p><strong>Phone:</strong> ${phone ?? 'Not provided'}</p>
          <p><strong>Interest/Issue:</strong> ${interest ?? 'Not provided'}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Contractor ID:</strong> ${user?.id ?? 'Not logged in'}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">TradeReach Chatbot System</p>
        </div>
      `,
    })

    return Response.json({ success: true, leadId: lead?.id })
  } catch (err) {
    console.error('Chat leads error:', err)
    return Response.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}
