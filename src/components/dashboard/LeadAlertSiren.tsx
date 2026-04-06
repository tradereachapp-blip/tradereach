'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface LeadPreview {
  id: string
  name: string
  niche: string
  zip: string
  created_at: string
  callback_time: string | null
}

interface Props {
  contractorId: string
  niche: string
  zipCodes: string[]
  isElite: boolean
  initialLeadIds: string[]
  alertSound?: string
}

// ── Audio context — singleton to avoid hitting browser limit of 6 contexts ─────
// Browsers also require a user gesture before audio can play. We resume the
// context lazily on first user interaction via the module-level listener below.
let _audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  // Resume in case the context was auto-suspended (browser autoplay policy)
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {/* ignore */})
  }
  return _audioCtx
}

// Prime the audio context on the very first user interaction so sounds can
// play immediately when a lead arrives (without waiting for another click).
if (typeof window !== 'undefined') {
  const primeAudio = () => {
    try {
      const ctx = getCtx()
      // Create and immediately stop a silent buffer to unlock the context
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start(0)
      src.stop(0.001)
    } catch { /* ignore */ }
    window.removeEventListener('click', primeAudio)
    window.removeEventListener('touchstart', primeAudio)
    window.removeEventListener('keydown', primeAudio)
  }
  window.addEventListener('click', primeAudio, { once: true })
  window.addEventListener('touchstart', primeAudio, { once: true })
  window.addEventListener('keydown', primeAudio, { once: true })
}

function playSiren() {
  try {
    const ctx = getCtx()
    function pulse(startTime: number, freq1: number, freq2: number, duration: number) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq1, startTime)
      osc.frequency.linearRampToValueAtTime(freq2, startTime + duration * 0.5)
      osc.frequency.linearRampToValueAtTime(freq1, startTime + duration)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.05)
      gain.gain.linearRampToValueAtTime(0.18, startTime + duration - 0.05)
      gain.gain.linearRampToValueAtTime(0, startTime + duration)
      osc.start(startTime); osc.stop(startTime + duration)
    }
    const t = ctx.currentTime
    pulse(t, 600, 900, 0.4)
    pulse(t + 0.45, 600, 900, 0.4)
    pulse(t + 0.9, 600, 900, 0.4)
  } catch { /* silent */ }
}

function playChime() {
  try {
    const ctx = getCtx()
    const freqs = [1047, 1319, 1568]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.2, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6)
      osc.start(start); osc.stop(start + 0.65)
    })
  } catch { /* silent */ }
}

function playBell() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 880
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0)
    osc.start(t); osc.stop(t + 2.1)
  } catch { /* silent */ }
}

function playPing() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 1200
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0.25, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
    osc.start(t); osc.stop(t + 0.35)
  } catch { /* silent */ }
}

function playDing() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 523
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
    osc.start(t); osc.stop(t + 0.85)
  } catch { /* silent */ }
}

export function playAlertSound(sound: string) {
  switch (sound) {
    case 'chime': return playChime()
    case 'bell': return playBell()
    case 'ping': return playPing()
    case 'ding': return playDing()
    case 'none': return
    default: return playSiren()
  }
}

// ── Component ────────────────────────────────────────────────────────────────
const NICHE_ICONS: Record<string, string> = {
  Roofing: '🏠', HVAC: '❄️', Plumbing: '🔧',
  Electrical: '⚡', 'Windows & Doors': '🪟', Painting: '🎨',
}

export default function LeadAlertSiren({
  contractorId, niche, zipCodes, isElite, initialLeadIds, alertSound = 'siren',
}: Props) {
  const [newLead, setNewLead] = useState<LeadPreview | null>(null)
  const [visible, setVisible] = useState(false)
  const [flash, setFlash] = useState(false)
  const knownIds = useRef<Set<string>>(new Set(initialLeadIds))
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setVisible(false)
    setFlash(false)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
  }, [])

  const triggerAlert = useCallback((lead: LeadPreview) => {
    setNewLead(lead)
    setVisible(true)
    setFlash(true)
    playAlertSound(alertSound)

    let alt = false
    const original = document.title
    const flashTitle = setInterval(() => {
      document.title = alt ? '🚨 NEW LEAD!' : original
      alt = !alt
    }, 600)

    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => {
      setVisible(false)
      setFlash(false)
      clearInterval(flashTitle)
      document.title = original
    }, 45000)

    return () => clearInterval(flashTitle)
  }, [alertSound])

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/leads/poll', { cache: 'no-store' })
        if (!res.ok) return
        const { leads } = await res.json() as { leads: LeadPreview[] }
        for (const lead of leads) {
          if (!knownIds.current.has(lead.id)) {
            knownIds.current.add(lead.id)
            triggerAlert(lead)
            break
          }
        }
      } catch { /* ignore */ }
    }

    const interval = setInterval(poll, 20000)
    return () => clearInterval(interval)
  }, [triggerAlert])

  if (!visible || !newLead) return null

  return (
    <>
      {flash && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{ animation: 'sirenFlash 0.5s ease-in-out 6', background: 'rgba(239,68,68,0.12)' }}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={dismiss}>
        <div
          className="relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden cursor-default"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1c0a00 100%)',
            borderColor: 'rgba(239,68,68,0.5)',
            boxShadow: '0 0 60px rgba(239,68,68,0.3), 0 25px 50px rgba(0,0,0,0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-red-500 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-sm uppercase tracking-widest animate-pulse">
                🚨 New Lead
              </span>
              {isElite && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  15-min exclusive
                </span>
              )}
            </div>
            <button onClick={dismiss} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-3xl flex-shrink-0">
                {NICHE_ICONS[newLead.niche] ?? '🏠'}
              </div>
              <div>
                <p className="text-white font-black text-xl">{(newLead.name ?? newLead.homeowner_name ?? 'Lead').split(' ')[0]}</p>
                <p className="text-gray-400 text-sm">{newLead.niche} · ZIP {newLead.zip}</p>
                {newLead.callback_time && (
                  <p className="text-gray-500 text-xs mt-0.5">Prefers: {newLead.callback_time}</p>
                )}
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-5 text-center">
              A homeowner in <strong className="text-white">{newLead.zip}</strong> is looking for a <strong className="text-white">{newLead.niche}</strong> contractor right now.
            </p>

            <a
              href="/dashboard"
              className="block w-full text-center bg-red-500 hover:bg-red-600 text-white font-black py-3.5 rounded-xl transition-all text-base shadow-lg shadow-red-500/30 hover:scale-[1.02]"
              onClick={dismiss}
            >
              Claim This Lead Now →
            </a>

            <button
              onClick={dismiss}
              className="block w-full text-center text-gray-600 hover:text-gray-400 text-sm mt-3 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sirenFlash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  )
}
