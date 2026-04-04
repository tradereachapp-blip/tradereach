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
}

function playSiren() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    function pulse(startTime: number, freq1: number, freq2: number, duration: number) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq1, startTime)
      osc.frequency.linearRampToValueAtTime(freq2, startTime + duration * 0.5)
      osc.frequency.linearRampToValueAtTime(freq1, startTime + duration)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.05)
      gain.gain.linearRampToValueAtTime(0.18, startTime + duration - 0.05)
      gain.gain.linearRampToValueAtTime(0, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    const t = ctx.currentTime
    pulse(t,       600, 900, 0.4)
    pulse(t + 0.45, 600, 900, 0.4)
    pulse(t + 0.9,  600, 900, 0.4)
  } catch { /* user hasn't interacted yet — silent */ }
}

const NICHE_ICONS: Record<string, string> = {
  Roofing: '🏠', HVAC: '❄️', Plumbing: '🔧',
  Electrical: '⚡', 'Windows & Doors': '🪟', Painting: '🎨',
}

export default function LeadAlertSiren({
  contractorId, niche, zipCodes, isElite, initialLeadIds,
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
    playSiren()
    // Flash the tab title
    let alt = false
    const original = document.title
    const flashTitle = setInterval(() => {
      document.title = alt ? '🚨 NEW LEAD!' : original
      alt = !alt
    }, 600)
    // Auto-dismiss after 45 seconds
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => {
      setVisible(false)
      setFlash(false)
      clearInterval(flashTitle)
      document.title = original
    }, 45000)
    return () => clearInterval(flashTitle)
  }, [])

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
            break // only alert once per poll cycle
          }
        }
      } catch { /* ignore */ }
    }

    const interval = setInterval(poll, 20000) // every 20 seconds
    return () => clearInterval(interval)
  }, [triggerAlert])

  if (!visible || !newLead) return null

  return (
    <>
      {/* Flashing red overlay */}
      {flash && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            animation: 'sirenFlash 0.5s ease-in-out 6',
            background: 'rgba(239,68,68,0.12)',
          }}
        />
      )}

      {/* Alert modal */}
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
          {/* Top bar */}
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

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-3xl flex-shrink-0">
                {NICHE_ICONS[newLead.niche] ?? '🏡'}
              </div>
              <div>
                <p className="text-white font-black text-xl">{newLead.name.split(' ')[0]}</p>
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
              className="block w-full text-center bg-red-500 hover:bg-red-600 text-white font-black py-3.5 rounded-xl transition-all text-base shadow-lg shadow-red-500/30"
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
