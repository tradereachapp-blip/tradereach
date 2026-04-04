// ─── Chat API Route ──────────────────────────────────────────────────────────
// Calls Anthropic Claude API, handles encryption, sensitive data detection,
// escalation detection, and saves messages to Supabase.

import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { encryptMessage, containsSensitiveData } from '@/lib/encryption'
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/resend/client'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are the TradeReach support assistant. TradeReach is a lead generation platform connecting homeowners who need home services with local contractors. You help contractors use the platform effectively.

Here is everything you need to know about TradeReach:

PRICING PLANS:
* Pay Per Lead: $45 per lead, no monthly fee, up to 5 zip codes
* Pro: $397 per month, 20 leads included, shared territory, $30 per lead after cap, 7 day free trial
* Elite: $697 per month, unlimited leads, exclusive zip code territory, 15 minute priority window before other contractors, 7 day free trial

HOW LEADS WORK: Homeowners fill out a form on our website requesting a free quote. Their information is matched to contractors based on niche and zip code. The matched contractor receives an SMS and email notification instantly. Elite contractors get notified first and have a 15 minute priority window. After 15 minutes if unclaimed the next contractor in queue is notified. Once a contractor claims a lead they get the homeowner's full contact information including phone number. No other contractor can claim that lead once it is taken. One lead goes to one contractor only.

HOW TO CLAIM A LEAD: Log into your dashboard. Go to Available Leads. Click Claim on any lead that matches your service area. Pay per lead contractors are charged $45 at the moment of claiming. Pro contractors under their monthly cap claim for free. Pro contractors over their cap are charged $30. Elite contractors claim unlimited leads at no extra charge.

ZIP CODES: You can add and remove zip codes in Settings under Service ZIP Codes. Pro plan allows up to 10 zip codes. Elite plan allows unlimited zip codes. Pay per lead allows up to 5 zip codes. Only enter 5 digit US zip codes.

NOTIFICATIONS: You can receive SMS and email notifications when new leads come in. Manage notification preferences in Settings under Notification Preferences. You can set a separate SMS notification number different from your business phone number.

BILLING: Manage your subscription, update payment method, and view invoices through the Stripe billing portal. Access it in Settings under Subscription by clicking Manage Billing and Subscription. Pro and Elite plans have a 7 day free trial before your card is charged. Subscriptions renew monthly automatically.

UPGRADING OR DOWNGRADING: You can upgrade or downgrade your plan anytime through the billing portal in Settings. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.

CANCELLATION: You can cancel anytime through the billing portal in Settings. There are no cancellation fees. You keep access until the end of your current billing period.

LEAD QUALITY: We run Facebook ads targeting homeowners who are actively requesting quotes for home services. These are real homeowners who filled out a form and consented to be contacted. We recommend calling leads within 5 minutes of receiving the notification for the highest close rate. 🏠

EXCLUSIVE TERRITORY: Elite subscribers own their zip codes exclusively. No other contractor in an Elite zip code receives leads for that zip. This means zero competition for leads in your area. ⚡

PRIORITY WINDOW: Elite contractors get a 15 minute head start on every new lead before any other contractor is notified. After 15 minutes if unclaimed the lead goes to the next contractor in queue.

ESCALATION RULES: If a contractor mentions wanting a refund, reports a technical bug, or expresses significant frustration — acknowledge their issue warmly and say you are flagging it for the support team. Ask for their email and phone number to follow up within 24 hours.

LEAD CAPTURE RULES: If someone asks about the platform but does not appear to be a signed-up contractor, ask for their name, email, and phone number so the team can get them set up.

CANCELLATION RETENTION: If a contractor mentions wanting to cancel, first ask what the issue is and try to offer a solution. If they are still intent on canceling, collect their contact info and say the team will reach out personally.

Always be helpful, friendly, and concise. Use the contractor's first name when you know it. Use occasional relevant emojis — maximum one per response. Keep responses short and conversational. Use line breaks to make responses easy to read on mobile. Never make up information about the platform.`

// Detect if message requires escalation
function requiresEscalation(text: string): boolean {
  const triggers = [
    /refund/i, /bug/i, /broken/i, /not work/i, /doesn.t work/i,
    /furious/i, /angry/i, /terrible/i, /worst/i, /scam/i, /fraud/i,
    /cancel.*account/i, /want.*cancel/i, /charged.*wrong/i, /double.charged/i,
  ]
  return triggers.some(t => t.test(text))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { messages, sessionId, contractorName } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      sessionId: string | null
      contractorName: string | null
    }

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    const admin = createAdminClient()
    const lastUserMessage = messages[messages.length - 1]?.content ?? ''
    const startTime = Date.now()

    // 1. Check / create session
    let activeSessionId = sessionId
    if (!activeSessionId && user) {
      const { data: session } = await admin.from('chat_sessions').insert({
        contractor_id: user.id,
        session_source: 'dashboard',
        status: 'active',
      }).select('id').single()
      activeSessionId = session?.id ?? null
    }

    // 2. Sensitive data check on user message
    const isSensitive = containsSensitiveData(lastUserMessage)
    const contentToStore = isSensitive
      ? 'Message contained sensitive data and was not stored for security.'
      : lastUserMessage

    // Log sensitive data detection
    if (isSensitive && activeSessionId && user) {
      await admin.from('blocked_content_log').insert({
        session_id: activeSessionId,
        contractor_id: user?.id ?? null,
        content_type: 'other_sensitive',
        action_taken: 'content_not_stored',
        admin_notified: false,
      })
      // Notify admin
      resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: '⚠️ TradeReach Chat: Sensitive Data Detected',
        html: `<p>A chat message contained what appears to be sensitive data (credit card, SSN, or bank account). The content was not stored. Contractor ID: ${user?.id ?? 'unknown'}</p>`,
      }).catch(() => {})
    }

    // 3. Save user message to DB
    if (activeSessionId && user) {
      await admin.from('chat_messages').insert({
        session_id: activeSessionId,
        contractor_id: user.id,
        role: 'user',
        content: encryptMessage(contentToStore),
        content_encrypted: true,
        is_sensitive: isSensitive,
      })
    }

    // 4. Build system prompt with contractor name if available
    const systemWithName = contractorName
      ? SYSTEM_PROMPT + `\n\nThe contractor's first name is: ${contractorName}. Always address them by name.`
      : SYSTEM_PROMPT

    // 5. Call Anthropic API
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: systemWithName,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text()
      console.error('Anthropic API error:', err)
      return Response.json({ error: 'AI service error' }, { status: 502 })
    }

    const aiData = await anthropicResponse.json() as {
      content: Array<{ type: string; text: string }>
      usage: { input_tokens: number; output_tokens: number }
    }

    const responseTime = Date.now() - startTime
    const aiText = aiData.content[0]?.text ?? 'Sorry, I could not generate a response.'
    const totalTokens = (aiData.usage?.input_tokens ?? 0) + (aiData.usage?.output_tokens ?? 0)

    // 6. Save AI response to DB
    if (activeSessionId && user) {
      await admin.from('chat_messages').insert({
        session_id: activeSessionId,
        contractor_id: user.id,
        role: 'assistant',
        content: encryptMessage(aiText),
        content_encrypted: true,
        is_sensitive: false,
        message_tokens: totalTokens,
        response_time_ms: responseTime,
      })

      // Update session last_message_at and total_messages
      await admin.from('chat_sessions')
        .update({ last_message_at: new Date().toISOString(), total_messages: messages.length + 1 })
        .eq('id', activeSessionId)
    }

    // 7. Check for escalation triggers
    const needsEscalation = requiresEscalation(lastUserMessage)
    if (needsEscalation && activeSessionId && user) {
      await admin.from('support_escalations').insert({
        session_id: activeSessionId,
        contractor_id: user.id,
        issue_summary: lastUserMessage.slice(0, 500),
        issue_category: /refund|charge|bill/i.test(lastUserMessage) ? 'billing' :
          /bug|broken|work/i.test(lastUserMessage) ? 'technical' :
          /cancel/i.test(lastUserMessage) ? 'cancellation' : 'other',
        priority: 'normal',
        status: 'open',
      })
    }

    // 8. Generate contextual follow-up suggestions
    const suggestions = generateSuggestions(lastUserMessage, aiText)

    return Response.json({
      content: aiText,
      sessionId: activeSessionId,
      suggestions,
      needsEscalation,
    })

  } catch (err) {
    console.error('Chat API error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSuggestions(userMsg: string, aiResponse: string): string[] {
  const msg = (userMsg + ' ' + aiResponse).toLowerCase()

  if (/lead|claim|available/i.test(msg)) {
    return ['How do I claim a lead?', 'What info do I get after claiming?', 'How fast do I need to respond?']
  }
  if (/bill|payment|invoice|stripe|subscription/i.test(msg)) {
    return ['How do I upgrade my plan?', 'Can I cancel anytime?', 'Where do I view invoices?']
  }
  if (/zip|area|territory/i.test(msg)) {
    return ['How many zip codes can I add?', 'What is exclusive territory?', 'How do I add a zip code?']
  }
  if (/notif|sms|email|alert/i.test(msg)) {
    return ['How do I set up SMS alerts?', 'Can I use a different phone for SMS?', 'Why am I not getting notifications?']
  }
  if (/elite|upgrade|pro/i.test(msg)) {
    return ['What is the Elite priority window?', 'How do I upgrade?', 'Is there a free trial?']
  }
  if (/cancel/i.test(msg)) {
    return ['Can I pause instead of cancel?', 'What happens to my leads if I cancel?', 'How do I downgrade my plan?']
  }

  // Default suggestions
  return ['How do leads work?', 'How do I add zip codes?', 'How do I upgrade my plan?']
}
