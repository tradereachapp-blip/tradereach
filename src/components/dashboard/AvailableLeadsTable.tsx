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
    <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
      ⚡ PRIORITY: {mins}:{s.toString().padStart(2, '0')}
    </span>
  )
}

export default function AvailableLeadsTable({ leads, contractor }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())

  const isElite = contractor.plan_type === 'elite'
  const isOverCap = contractor.plan_type === 'pro' && contractor.leads_used_this_month >= PRO_MONTHLY_LEAD_CAP

  function handleClaimed(leadId: string) {
    setClaimedIds(new Set([...claimedIds, leadId]))
    setSelectedLead(null)
  }

  const activeleads = leads.filter(l => !claimedIds.has(l.id))

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ZIP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Best Time</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeleads.map((lead) => {
                const isPriorityWindow = isElite &&
                  (Date.now() - new Date(lead.created_at).getTime()) < ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-gray-50 transition-colors ${isPriorityWindow ? 'bg-purple-50/30' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900">{lead.name.split(' ')[0]}</span>
                        {isPriorityWindow && <PriorityCountdown createdAt={lead.created_at} />}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">{lead.zip}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {lead.niche}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      {timeSince(lead.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {lead.callback_time ?? 'Anytime'}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {isOverCap ? 'Claim ($25)' :
                         contractor.plan_type === 'pay_per_lead' ? 'Claim ($45)' :
                         'Claim'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
