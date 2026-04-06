'use client'

import { useState, useEffect } from 'react'
import type { Lead, Contractor } from '@/types'
import { ELITE_PRIORITY_WINDOW_MINUTES, PRO_MONTHLY_LEAD_CAP } from '@/lib/config'
import ClaimLeadModal from './ClaimLeadModal'

interface Props {
  leads: Lead[]
  contractor: Contractor
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function PriorityCountdown({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function calc() {
      const eliteWindowMs = ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000
      const leadTime = new Date(createdAt).getTime()
      const expiresAt = leadTime + eliteWindowMs
      const rem = Math.max(0, expiresAt - Date.now())
      setRemaining(rem)
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [createdAt])

  if (remaining === 0) return null

  const secs = Math.floor(remaining / 1000)
  const mins = Math.floor(secs / 60)
  const s = secs % 60

  return (
    <span className="inline-flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-2.5 py-1 rounded-full animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping inline-block" />
      PRIORITY: {mins}:{s.toString().padStart(2, '0')}
    </span>
  )
}

const NICHE_ICONS: Record<string, string> = {
  Roofing: '🏠',
  HVAC: '❄️',
  Plumbing: '🔧',
  Electrical: '⚡',
  'Windows & Doors': '🪟',
  Painting: '🎨',
}

export default function AvailableLeadsTable({ leads, contractor }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())

  const isElite = contractor.plan_type === 'elite' || contractor.plan_type === 'elite_plus'
  const isOverCap = contractor.plan_type === 'pro' && contractor.leads_used_this_month >= PRO_MONTHLY_LEAD_CAP

  function handleClaimed(leadId: string) {
    setClaimedIds(new Set([...claimedIds, leadId]))
    setSelectedLead(null)
  }

  const activeLeads = leads.filter(l => !claimedIds.has(l.id))

  return (
    <>
      <div className="space-y-3">
        {activeLeads.map((lead, idx) => {
          const isPriorityWindow = isElite &&
            (Date.now() - new Date(lead.created_at).getTime()) < ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000

          const claimLabel = isOverCap ? 'Claim ($25)' :
            contractor.plan_type === 'pay_per_lead' ? 'Claim ($45)' : 'Claim Lead'

          return (
            <div
              key={lead.id}
              className={`relative rounded-xl border transition-all duration-200 overflow-hidden group
                ${isPriorityWindow
                  ? 'border-orange-500/40 bg-orange-500/5 shadow-lg shadow-orange-500/10'
                  : 'border-white/8 bg-gray-900 hover:border-white/20 hover:bg-gray-800/50'
                }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Priority stripe */}
              {isPriorityWindow && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-l-xl" />
              )}

              <div className="flex items-center gap-4 px-5 py-4 pl-6">
                {/* Niche icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                  ${isPriorityWindow ? 'bg-orange-500/20' : 'bg-white/5'}`}>
                  {NICHE_ICONS[lead.niche] ?? '🏡'}
                </div>

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-white text-base">{lead.name.split(' ')[0]}  ·  {lead.zip}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${isPriorityWindow
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}>
                      {lead.niche}
                    </span>
                    {isPriorityWindow && <PriorityCountdown createdAt={lead.created_at} />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>🕐 {timeSince(lead.created_at)}</span>
                    {lead.callback_time && <span>📞 Prefers {lead.callback_time}</span>}
                    {lead.description && (
                      <span className="text-gray-400 truncate max-w-xs">"{lead.description}"</span>
                    )}
                  </div>
                </div>

                {/* Claim button */}
                <button
                  onClick={() => setSelectedLead(lead)}
                  className={`flex-shrink-0 font-bold px-5 py-2.5 rounded-xl transition-all text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg
                    ${isPriorityWindow
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/15'
                    }`}
                >
                  {claimLabel}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedLead && (
        <ClaimLeadModal
          lead={selectedLead}
          contractor={contractor}
          onClose={() => setSelectedLead(null)}
          onClaimed={() => handleClaimed(selectedLead.id)}
        />
      )}
    </>
  )
}
