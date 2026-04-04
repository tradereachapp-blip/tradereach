// ─── Chat Feedback Route ─────────────────────────────────────────────────────
// Saves thumbs up/down reactions and chat lead captures to Supabase.

import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/resend/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { type, messageId, sessionId, feedbackText, reaction } = body

    const admin = createAdminClient()

    if (type === 'reaction') {
      // Save reaction to chat_messages
      if (messageId) {
        await admin.from('chat_messages').update({
          reaction,
          reaction_at: new Date().toISOString(),
        }).eq('id', messageId)
      }

      // Save to chat_feedback table
      await admin.from('chat_feedback').insert({
        session_id: sessionId,
        message_id: messageId,
        contractor_id: user?.id ?? null,
        feedback_type: reaction,
        feedback_text: feedbackText ?? null,
        category: reaction === 'thumbs_up' ? 'helpful' : 'not_helpful',
      })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Feedback error:', err)
    return Response.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
