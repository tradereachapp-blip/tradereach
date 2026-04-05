'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

interface LeadData {
  id: string
  name: string
  phone: string
  zip: string
  niche: string
  description: string | null
  callback_time: string | null
  created_at: string
}

interface Claim {
  id: string
  claimed_at: string
  payment_type: string
  amount_charged: number | null
  lead_status: string
  notes: string | null
  job_value: number | null
  follow_up_date: string | null
  contact_attempts: number
  leads: LeadData
}

interface Toast {
  id: number
  message: string
}

const STATUSES = [
  'New',
  'Contacted',
  'Appointment Set',
  'Quote Sent',
  'Closed Won',
  'Closed Lost',
  'Not Interested',
]

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'Contacted': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  'Appointment Set': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'Quote Sent': 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'Closed Won': 'bg-green-500/15 text-green-400 border-green-500/25',
  'Closed Lost': 'bg-gray-700 text-gray-400 border-white/10',
  'Not Interested': 'bg-gray-700 text-gray-400 border-white/10',
}

function formatPhone(phone: string): { display: string; e164: string } {
  const digits = phone.replace(/\D/g, '')
  const ten = digits.slice(-10)
  const display = `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`
  const e164 = `+1${ten}`
  return { display, e164 }
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function Toast({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null
  const t = toasts[toasts.length - 1]
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-gray-900 border-l-4 border-green-500 rounded-xl px-5 py-3.5 shadow-2xl min-w-[220px]">
        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-white font-medium">{t.message}</span>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-2xl border border-white/8 p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded w-32" />
          <div className="h-3 bg-gray-800 rounded w-20" />
        </div>
        <div className="h-6 bg-gray-800 rounded-full w-20" />
      </div>
      <div className="h-3 bg-gray-800 rounded w-1/2" />
    </div>
  )
}

export default function ClaimedLeadsClient({ initialClaims }: { initialClaims: Claim[] }) {
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [claims, setClaims] = useState<Claim[]>(initialClaims)
  const [expandedId, setExpandedId] = useState<string | null>(highlightId)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [savedAt, setSavedAt] = useState<Record<string, boolean>>({})
  const [toasts, setToasts] = useState<Toast[]>([])
  const [highlighted, setHighlighted] = useState<string | null>(highlightId)
  const toastId = useRef(0)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Remove highlight after 10s
  useEffect(() => {
    if (!highlighted) return
    const t = setTimeout(() => setHighlighted(null), 10000)
    return () => clearTimeout(t)
  }, [highlighted])

  // Scroll to highlighted card
  useEffect(() => {
    if (!highlighted) return
    setTimeout(() => {
      const el = cardRefs.current[highlighted]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
  }, [highlighted])

  function showToast(message: string) {
    const id = ++toastId.current
    setToasts(prev => [...prev.slice(-1), { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  function updateClaim(claimId: string, updates: Partial<Claim>) {
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, ...updates } : c))
  }

  async function saveField(claimId: string, field: string, value: unknown) {
    setSaving(p => ({ ...p, [claimId]: true }))
    try {
      await fetch('/api/leads/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claimId, [field]: value }),
      })
      setSavedAt(p => ({ ...p, [claimId]: true }))
      setTimeout(() => setSavedAt(p => ({ ...p, [claimId]: false })), 2000)
    } finally {
      setSaving(p => ({ ...p, [claimId]: false }))
    }
  }

  async function handleStatusChange(claim: Claim, newStatus: string) {
    updateClaim(claim.id, { lead_status: newStatus })
    await saveField(claim.id, 'lead_status', newStatus)
    showToast('Status updated')
  }

  async function handleNotesBlur(claim: Claim, notes: string) {
    await saveField(claim.id, 'notes', notes)
    showToast('Notes saved')
  }

  async function handleJobValueBlur(claim: Claim, val: string) {
    const num = val ? parseFloat(val) : null
    updateClaim(claim.id, { job_value: num })
    await saveField(claim.id, 'job_value', num)
    showToast('Job value saved')
  }

  async function handleFollowUpBlur(claim: Claim, date: string) {
    updateClaim(claim.id, { follow_up_date: date || null })
    await saveField(claim.id, 'follow_up_date', date || null)
    showToast('Follow-up date saved')
  }

  async function handleContactAttempts(claim: Claim, delta: number) {
    const newVal = Math.max(0, (claim.contact_attempts || 0) + delta)
    updateClaim(claim.id, { contact_attempts: newVal })
    await saveField(claim.id, 'contact_attempts', newVal)
  }

  // ROI Summary
  const totalClaimed = claims.length
  const closedWon = claims.filter(c => c.lead_status === 'Closed Won')
  const closedWonCount = closedWon.length
  const totalJobValue = closedWon.reduce((sum, c) => sum + (c.job_value || 0), 0)
  const avgJobValue = closedWonCount > 0 ? totalJobValue / closedWonCount : 0

  return (
    <>
      {/* ROI Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Claimed', value: totalClaimed.toString(), sub: 'all time' },
          { label: 'Closed Won', value: closedWonCount.toString(), sub: 'jobs won' },
          { label: 'Total Job Value', value: totalJobValue > 0 ? `$${totalJobValue.toLocaleString()}` : '$0', sub: 'from TradeReach' },
          { label: 'Avg Job Value', value: avgJobValue > 0 ? `$${Math.round(avgJobValue).toLocaleString()}` : '—', sub: 'per closed job' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-gray-900 border border-white/8 rounded-xl px-4 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {claims.length === 0 && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl py-16 text-center">
          <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No claimed leads yet</h3>
          <p className="text-gray-500 text-sm">Claimed leads appear here with full contact details.</p>
          <a href="/dashboard" className="mt-4 inline-block text-orange-400 font-medium hover:text-orange-300 transition-colors text-sm">
            Browse available leads →
          </a>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {claims.map((claim) => {
          const lead = claim.leads
          if (!lead) return null
          const { display: phoneDisplay, e164 } = formatPhone(lead.phone)
          const isExpanded = expandedId === claim.id
          const isHighlighted = highlighted === lead.id
          const status = claim.lead_status || 'New'
          const isClosedWon = status === 'Closed Won'

          return (
            <div
              key={claim.id}
              ref={el => { cardRefs.current[lead.id] = el }}
              className="bg-gray-900 rounded-2xl border transition-all duration-300 overflow-hidden"
              style={{
                borderColor: isHighlighted ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.08)',
                boxShadow: isHighlighted ? '0 0 0 2px rgba(249,115,22,0.2), 0 0 20px rgba(249,115,22,0.1)' : 'none',
              }}
            >
              {/* Card Header — clickable */}
              <div
                className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : claim.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">
                      {lead.name.split(' ')[0]}
                    </h3>
                    <p className="text-gray-500 text-sm mt-0.5">{lead.niche}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] || STATUS_COLORS['New']}`}>
                      {status}
                    </span>
                    {claim.contact_attempts > 0 && (
                      <span className="text-xs text-gray-600">{claim.contact_attempts} attempts</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">📍 {lead.zip}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{timeAgo(claim.claimed_at)}</span>
                  {claim.follow_up_date && (
                    <>
                      <span className="text-gray-600">·</span>
                      <span className="text-orange-400 text-xs">📅 {new Date(claim.follow_up_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </>
                  )}
                </div>

                {/* Expand indicator */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${e164}`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                    >
                      📞 {phoneDisplay}
                    </a>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Notes Section */}
              {isExpanded && (
                <div
                  className="border-t border-white/8 p-5 space-y-4 bg-gray-950/50"
                  style={{ animation: 'expandDown 0.2s ease-out' }}
                >
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Status</label>
                    <select
                      value={status}
                      onChange={e => handleStatusChange(claim, e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s} style={{ backgroundColor: '#1f2937' }}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Job Value — only when Closed Won */}
                  {isClosedWon && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Closed Job Value</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                          type="number"
                          defaultValue={claim.job_value ?? ''}
                          onBlur={e => handleJobValueBlur(claim, e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full bg-gray-800 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Contact Attempts */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Contact Attempts</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleContactAttempts(claim, -1)}
                        className="w-9 h-9 rounded-xl bg-gray-800 border border-white/10 text-white hover:bg-gray-700 transition-all text-lg font-bold flex items-center justify-center hover:scale-105"
                      >−</button>
                      <span className="text-xl font-bold text-white w-8 text-center">{claim.contact_attempts || 0}</span>
                      <button
                        onClick={() => handleContactAttempts(claim, 1)}
                        className="w-9 h-9 rounded-xl bg-gray-800 border border-white/10 text-white hover:bg-gray-700 transition-all text-lg font-bold flex items-center justify-center hover:scale-105"
                      >+</button>
                    </div>
                  </div>

                  {/* Follow-Up Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Follow-Up Date</label>
                    <input
                      type="date"
                      defaultValue={claim.follow_up_date ?? ''}
                      onBlur={e => handleFollowUpBlur(claim, e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</label>
                      {saving[claim.id] && <span className="text-xs text-gray-500">Saving...</span>}
                      {savedAt[claim.id] && !saving[claim.id] && <span className="text-xs text-green-400">✓ Saved</span>}
                    </div>
                    <textarea
                      defaultValue={claim.notes ?? ''}
                      onBlur={e => handleNotesBlur(claim, e.target.value)}
                      placeholder="Call notes, follow-up reminders, anything relevant..."
                      rows={4}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Lead details footer */}
                  {lead.description && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Homeowner Description</label>
                      <p className="text-gray-400 text-sm bg-gray-800/60 border border-white/6 rounded-lg p-3">{lead.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>Best time: <span className="text-gray-400">{lead.callback_time ?? 'Anytime'}</span></div>
                    <div>Submitted: <span className="text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Toast toasts={toasts} />

      <style>{`
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </>
  )
}
