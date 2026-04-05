'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RexBubbleIcon } from '@/components/Rex'
import type { RexAnimation } from '@/context/RexContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  reaction?: 'thumbs_up' | 'thumbs_down' | null
  readReceipt?: 'sent' | 'read'
  dbId?: string
}

interface ChatBotProps {
  contractorName?: string | null
  contractorId?: string | null
}

// ─── Web Audio chime ──────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
    setTimeout(() => ctx.close(), 600)
  } catch {}
}

function haptic(pattern: number | number[]) {
  try { if ('vibrate' in navigator) navigator.vibrate(pattern) } catch {}
}

const DEFAULT_CHIPS = ['How do leads work?', 'How do I add zip codes?', 'How do I upgrade my plan?']

// ─── CSS for Rex animations in chat ──────────────────────────────────────────
const CHAT_STYLES = `
  @keyframes rexFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes rexWave  { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-15deg) translateY(-3px)} 50%{transform:rotate(0deg)} 75%{transform:rotate(-15deg) translateY(-3px)} }
  @keyframes rexThink { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
  @keyframes rexExcited { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-16px)} 60%{transform:translateY(0)} }
  @keyframes chatPulse { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.7)} 50%{box-shadow:0 0 0 12px rgba(249,115,22,0)} }
  @keyframes msgPop { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes speechPop { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  @media (prefers-reduced-motion:reduce){ [data-rex]{animation:none!important} }
`

function getRexAnimStyle(anim: RexAnimation): React.CSSProperties {
  switch (anim) {
    case 'wave':     return { animation: 'rexWave 1.5s ease-in-out' }
    case 'thinking': return { animation: 'rexThink 1.6s ease-in-out infinite' }
    case 'excited':  return { animation: 'rexExcited .8s ease-in-out' }
    default:         return { animation: 'rexFloat 3s ease-in-out infinite' }
  }
}

// ─── Main ChatBot ─────────────────────────────────────────────────────────────
export default function ChatBot({ contractorName, contractorId }: ChatBotProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDot, setShowDot] = useState(true)
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_CHIPS)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [rexAnim, setRexAnim] = useState<RexAnimation>('idle')
  const [bubblePulse, setBubblePulse] = useState(false)
  const [collectingInfo, setCollectingInfo] = useState(false)

  // Support escalation state
  const [escalationState, setEscalationState] = useState<null | 'offer' | 'form' | 'done'>(null)
  const [escalationSubject, setEscalationSubject] = useState('')
  const [escalationMessage, setEscalationMessage] = useState('')
  const [escalationSubmitting, setEscalationSubmitting] = useState(false)
  const [escalationEmail, setEscalationEmail] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const firstName = contractorName?.split(' ')[0] ?? null

  // ── Rex animation helpers ─────────────────────────────────────────────────
  const setRexAnimation = useCallback((anim: RexAnimation, duration = 2000) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setRexAnim(anim)
    if (anim !== 'idle' && anim !== 'thinking') {
      animTimerRef.current = setTimeout(() => setRexAnim('idle'), duration)
    }
  }, [])

  // ── Load sound pref ───────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('tr_chat_sound')
    if (saved !== null) setSoundEnabled(saved === 'true')
  }, [])

  const toggleSound = () => {
    setSoundEnabled(v => { localStorage.setItem('tr_chat_sound', String(!v)); return !v })
  }

  // ── Load chat history ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!contractorId) { setShowWelcome(true); setHistoryLoaded(true); return }
    fetch('/api/chat/history').then(r => r.json()).then(data => {
      if (data.messages?.length > 0) {
        setMessages(data.messages.map((m: {id:string;role:'user'|'assistant';content:string;created_at:string;reaction?:string}) => ({
          id: m.id, role: m.role, content: m.content,
          timestamp: new Date(m.created_at), reaction: m.reaction ?? null,
          readReceipt: 'read', dbId: m.id,
        })))
        setSessionId(data.sessionId)
      } else { setShowWelcome(true) }
      setHistoryLoaded(true)
    }).catch(() => { setShowWelcome(true); setHistoryLoaded(true) })
  }, [contractorId])

  // ── Welcome message ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!showWelcome) return
    const greeting = firstName
      ? `Hey ${firstName}! 👋 I'm Rex, your TradeReach AI assistant. I can help you with leads, billing, account settings, or anything else about the platform. What do you need?`
      : `Hey! 👋 I'm Rex, your TradeReach AI assistant. I can help you with leads, billing, account settings, or anything about the platform. What do you need?`
    setMessages([{ id: 'welcome', role: 'assistant', content: greeting, timestamp: new Date(), reaction: null, readReceipt: 'read' }])
    setSuggestions(DEFAULT_CHIPS)
  }, [showWelcome, firstName])

  // ── Wave on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setRexAnimation('wave', 1500)
      setUnreadCount(0); setShowDot(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, setRexAnimation])

  // ── Auto scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages, open])

  // ── Unread tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open && messages.length > 0 && messages[messages.length-1]?.role === 'assistant') {
      setUnreadCount(c => c + 1)
    }
  }, [messages]) // eslint-disable-line

  // ── Proactive pulse after 5s ──────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setBubblePulse(true), 5000)
    return () => clearTimeout(t)
  }, [])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    haptic(5)

    const userMsg: Message = {
      id: Date.now().toString(), role: 'user', content: text.trim(),
      timestamp: new Date(), readReceipt: 'sent',
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages); setInput(''); setLoading(true); setSuggestions([])
    setRexAnimation('thinking', 0)

    setTimeout(() => setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, readReceipt: 'read' } : m)), 400)

    const delay = 800 + Math.random() * 1200

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.map(m => ({ role: m.role, content: m.content })), sessionId, contractorName: firstName }),
      })
      const data = await res.json()
      await new Promise(r => setTimeout(r, delay))

      if (!res.ok || data.error) throw new Error(data.error ?? 'AI error')

      if (data.sessionId) setSessionId(data.sessionId)

      // Handle pre-AI escalation (situations 1, 3, 4)
      if (data.escalationTrigger && !data.content) {
        setEscalationSubject(data.suggestedSubject ?? '')
        setEscalationMessage(`Issue: ${text.trim()}\n\nPlease help me with this.`)
        const offerMsg: Message = {
          id: (Date.now()+1).toString(), role: 'assistant',
          content: `I want to make sure you get the right help on this. Want me to send a message to our support team? They typically respond within a few hours during business hours.`,
          timestamp: new Date(), reaction: null, readReceipt: 'read',
        }
        setMessages(prev => [...prev, offerMsg])
        setEscalationState('offer')
        setRexAnimation('idle', 0)
        if (soundEnabled) playChime()
        haptic([10])
        return
      }

      // Normal AI response
      const aiMsg: Message = {
        id: (Date.now()+1).toString(), role: 'assistant', content: data.content,
        timestamp: new Date(), reaction: null, readReceipt: 'read',
      }
      setMessages(prev => [...prev, aiMsg])
      if (data.suggestions?.length) setSuggestions(data.suggestions)
      setRexAnimation('idle', 0)
      if (soundEnabled) playChime()
      haptic([10])

      // Handle post-AI escalation (situations 2 + 5)
      if (data.escalationTrigger && data.content) {
        setTimeout(() => {
          setEscalationSubject(data.suggestedSubject ?? text.trim().slice(0, 80))
          setEscalationMessage(`I was asking about: ${text.trim()}\n\nAdditional context: [add any details here]`)
          const offerMsg: Message = {
            id: (Date.now()+50).toString(), role: 'assistant',
            content: data.escalationTrigger === 'no_resolution'
              ? `I want to make sure this gets handled properly. Want me to connect you with our support team? Our team is good at this — let me get them on it.`
              : `I want to make sure you get the right help on this. Want me to send a message to our support team? They typically respond within a few hours during business hours.`,
            timestamp: new Date(), reaction: null, readReceipt: 'read',
          }
          setMessages(prev => [...prev, offerMsg])
          setEscalationState('offer')
          if (soundEnabled) playChime()
        }, 1000)
      }

      // Detect contact info in user message
      const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
      const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
      if ((emailMatch || phoneMatch) && !collectingInfo) {
        setCollectingInfo(true)
        fetch('/api/chat/leads', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailMatch?.[0], phone: phoneMatch?.[0], interest: text, source: 'support', sessionId }),
        }).catch(() => {})
      }

    } catch {
      await new Promise(r => setTimeout(r, delay))
      setMessages(prev => [...prev, {
        id: (Date.now()+1).toString(), role: 'assistant',
        content: "I'm having trouble connecting right now. 😕 For urgent help, email support@tradereachapp.com.",
        timestamp: new Date(), reaction: null,
      }])
      setRexAnimation('idle', 0)
    } finally {
      setLoading(false)
    }
  }, [messages, loading, sessionId, firstName, soundEnabled, setRexAnimation, collectingInfo])

  const handleReaction = async (msg: Message, reaction: 'thumbs_up' | 'thumbs_down') => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reaction } : m))
    await fetch('/api/chat/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'reaction', messageId: msg.dbId ?? msg.id, sessionId, reaction }),
    }).catch(() => {})
    if (reaction === 'thumbs_down') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: 'assistant',
          content: "Thanks for the feedback — I want to do better. What was wrong with that response? I'll flag it for the team. 🙏",
          timestamp: new Date(),
        }])
        if (soundEnabled) playChime()
      }, 500)
    }
  }

  async function handleEscalationSubmit() {
    if (!escalationSubject.trim() || !escalationMessage.trim()) return
    setEscalationSubmitting(true)
    try {
      const conversationContext = messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: escalationSubject.trim(),
          message: escalationMessage.trim(),
          conversation_context: conversationContext,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setEscalationState('done')
        const replyEmail = escalationEmail || 'your account email'
        const confirmMsg: Message = {
          id: (Date.now()+2).toString(), role: 'assistant',
          content: `Done. Your message is on its way to our team. You'll hear back at ${replyEmail} within 24 hours. Ticket ID: ${data.short_id}. Anything else I can help with?`,
          timestamp: new Date(), reaction: null, readReceipt: 'read',
        }
        setMessages(prev => [...prev, confirmMsg])
        setSuggestions(DEFAULT_CHIPS)
        if (soundEnabled) playChime()
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: 'assistant',
          content: `Something went wrong submitting your request. Please email us directly at support@tradereachapp.com`,
          timestamp: new Date(), reaction: null,
        }])
        setEscalationState(null)
      }
    } catch {
      setEscalationState(null)
    } finally {
      setEscalationSubmitting(false)
    }
  }

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CHAT_STYLES}</style>

      {/* ── Rex bubble button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open Rex support chat"
        className={`fixed bottom-6 right-6 z-50 transition-all duration-200 active:scale-95 ${bubblePulse && !open ? '' : ''}`}
        style={{ WebkitTapHighlightColor: 'transparent', background: 'none', border: 'none', padding: 0 }}
      >
        <div
          data-rex
          style={{
            ...getRexAnimStyle(open ? 'idle' : rexAnim),
            width: 56, height: 56,
          }}
        >
          <RexBubbleIcon size={56} animation={open ? 'idle' : rexAnim} unread={open ? 0 : unreadCount} />
        </div>
      </button>

      {/* ── Chat window ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed z-50 flex flex-col bg-[#0f1729] border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          style={{
            bottom: '5.5rem', right: '1.5rem',
            width: 'min(370px, calc(100vw - 2rem))',
            height: 'min(580px, calc(100vh - 7rem))',
            borderRadius: '1.25rem',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a2744] border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Rex in header — 64px, idle float */}
              <div data-rex style={{ ...getRexAnimStyle('idle'), width: 48, height: 48, flexShrink: 0 }}>
                <img src="/images/rex-avatar.png" alt="Rex" style={{ width: 48, height: 48, objectFit: 'contain' }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm">Rex</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                </div>
                <div className="text-gray-400 text-[11px]">TradeReach AI Assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSound} className="text-gray-400 hover:text-white transition-colors p-1" aria-label={soundEnabled ? 'Mute' : 'Sound on'}>
                {soundEnabled ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M6.343 6.343a8 8 0 000 11.314" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
            {!historyLoaded && (
              <div className="flex justify-center py-8">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: `${i*.15}s` }} />)}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={msg.id} style={{ animation: 'msgPop .2s ease both' }}>
                {idx > 0 && isNewDay(messages[idx-1].timestamp, msg.timestamp) && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-[10px] text-gray-500">{formatDate(msg.timestamp)}</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                )}

                <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Rex avatar on AI messages */}
                  {msg.role === 'assistant' && (
                    <div data-rex style={{ ...getRexAnimStyle('idle'), width: 28, height: 28, flexShrink: 0, marginTop: 4 }}>
                      <img src="/images/rex-avatar.png" alt="Rex" style={{ width: 28, height: 28, objectFit: 'cover', objectPosition: 'top', borderRadius: '50%', border: '1.5px solid #f97316' }} />
                    </div>
                  )}

                  <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white rounded-br-md'
                        : 'bg-[#1a2744] text-gray-100 rounded-bl-md border border-white/8'
                    }`}>
                      {msg.content}
                    </div>

                    <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[10px] text-gray-600">{fmt(msg.timestamp)}</span>
                      {msg.role === 'user' && (
                        <span className={`text-[10px] ${msg.readReceipt === 'read' ? 'text-orange-400' : 'text-gray-600'}`}>
                          {msg.readReceipt === 'read' ? '✓✓' : '✓'}
                        </span>
                      )}
                      {msg.role === 'assistant' && msg.id !== 'welcome' && (
                        <div className="flex gap-1">
                          {(['thumbs_up','thumbs_down'] as const).map(r => (
                            <button key={r} onClick={() => handleReaction(msg, r)}
                              className={`text-[11px] transition-all hover:scale-110 active:scale-95 ${msg.reaction === r ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`}>
                              {r === 'thumbs_up' ? '👍' : '👎'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Rex thinking */}
            {loading && (
              <div className="flex gap-2 items-end">
                <div data-rex style={{ ...getRexAnimStyle('thinking'), width: 28, height: 28, flexShrink: 0 }}>
                  <img src="/images/rex-avatar.png" alt="Rex thinking" style={{ width: 28, height: 28, objectFit: 'cover', objectPosition: 'top', borderRadius: '50%', border: '1.5px solid #f97316' }} />
                </div>
                <div className="bg-[#1a2744] border border-white/8 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400"
                        style={{ animation: `typingDot 1.2s ease-in-out infinite`, animationDelay: `${i*.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Escalation: Offer Buttons ───────────────────────────────────── */}
          {escalationState === 'offer' && (
            <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-white/8 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setEscalationState('form')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors active:scale-95"
                >
                  Yes, send them a message
                </button>
                <button
                  onClick={() => { setEscalationState(null); setSuggestions(DEFAULT_CHIPS) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-[#1a2744] hover:bg-white/8 transition-colors active:scale-95"
                >
                  No, I'm good
                </button>
              </div>
            </div>
          )}

          {/* ── Escalation: Support Form ────────────────────────────────────── */}
          {escalationState === 'form' && (
            <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-white/8 space-y-2.5">
              <p className="text-xs text-gray-500 font-medium">We'll reply to <span className="text-gray-400">{escalationEmail || 'your email on file'}</span> within 24 hours.</p>
              <input
                type="text"
                value={escalationSubject}
                onChange={e => setEscalationSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-[#1a2744] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
              />
              <textarea
                value={escalationMessage}
                onChange={e => setEscalationMessage(e.target.value)}
                placeholder="Describe your issue..."
                rows={3}
                className="w-full bg-[#1a2744] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEscalationState('offer')}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 bg-[#1a2744] hover:text-gray-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleEscalationSubmit}
                  disabled={!escalationSubject.trim() || !escalationMessage.trim() || escalationSubmitting}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-colors active:scale-95"
                >
                  {escalationSubmitting ? 'Sending...' : 'Send to Support'}
                </button>
              </div>
            </div>
          )}

          {/* ── Normal: Chips ───────────────────────────────────────────────── */}
          {!escalationState && suggestions.length > 0 && !loading && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
              {suggestions.map(c => (
                <button key={c} onClick={() => sendMessage(c)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition-all whitespace-nowrap active:scale-95">
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* ── Normal: Input ───────────────────────────────────────────────── */}
          {(escalationState === null || escalationState === 'done') && (
            <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-white/8">
              <div className="flex gap-2 items-end">
                <input ref={inputRef} type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  placeholder="Ask Rex anything…"
                  className="flex-1 bg-[#1a2744] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/60 transition-colors"
                  style={{ fontSize: '16px' }}
                  disabled={loading}
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="text-center text-[9px] text-gray-700 mt-1.5">Powered by Claude AI · Ask Rex anything</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-4px);opacity:1} }
      `}</style>
    </>
  )
}

function isNewDay(a: Date, b: Date) { return a.toDateString() !== b.toDateString() }
function formatDate(d: Date) {
  const today = new Date(), yesterday = new Date(today)
  yesterday.setDate(today.getDate()-1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
