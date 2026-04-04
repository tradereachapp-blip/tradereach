// ─── Chat History Route ──────────────────────────────────────────────────────
// Returns decrypted chat history for the current contractor (last 30 days).

import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptMessage } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Get most recent active session within 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: session } = await admin.from('chat_sessions')
      .select('id')
      .eq('contractor_id', user.id)
      .eq('status', 'active')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!session) return Response.json({ messages: [], sessionId: null })

    // Get messages for session
    const { data: messages } = await admin.from('chat_messages')
      .select('id, role, content, content_encrypted, created_at, reaction')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(100)

    const decrypted = (messages ?? []).map(m => ({
      id: m.id,
      role: m.role,
      content: m.content_encrypted ? decryptMessage(m.content) : m.content,
      created_at: m.created_at,
      reaction: m.reaction,
    }))

    return Response.json({ messages: decrypted, sessionId: session.id })
  } catch (err) {
    console.error('Chat history error:', err)
    return Response.json({ error: 'Failed to load history' }, { status: 500 })
  }
}
