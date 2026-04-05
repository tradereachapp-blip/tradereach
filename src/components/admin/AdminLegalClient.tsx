'use client'

import { useState } from 'react'

interface CreditRequest {
  id: string
  created_at: string
  reason: string
  description: string | null
  status: string
  credit_amount: number | null
  contractors: { business_name: string; contact_name: string; stripe_customer_id: string | null } | null
  leads: { name: string; zip: string; niche: string } | null
}

interface DeletionRequest {
  id: string
  created_at: string
  email: string
  name: string | null
  status: string
}

interface LegalAcceptance {
  id: string
  accepted_at: string
  agreement_type: string
  agreement_version: string
  ip_address: string | null
  contractors: { business_name: string } | null
}

interface Props {
  pendingCredits: CreditRequest[]
  approvedCreditsCount: number
  deniedCreditsCount: number
  pendingDeletions: DeletionRequest[]
  completedDeletionsCount: number
  optedOutLeadsCount: number
  totalAcceptances: number
  contractorsWithoutTerms: number
  recentAcceptances: LegalAcceptance[]
}

const REASON_LABELS: Record<string, string> = {
  duplicate_lead: 'Duplicate Lead',
  disconnected_phone: 'Disconnected Phone',
  homeowner_did_not_submit: 'HO Did Not Submit',
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  )
}

export default function AdminLegalClient({
  pendingCredits,
  approvedCreditsCount,
  deniedCreditsCount,
  pendingDeletions,
  completedDeletionsCount,
  optedOutLeadsCount,
  totalAcceptances,
  contractorsWithoutTerms,
  recentAcceptances,
}: Props) {
  const [activeTab, setActiveTab] = useState<'credits' | 'deletions' | 'acceptances'>('credits')
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [credits, setCredits] = useState(pendingCredits)
  const [deletions, setDeletions] = useState(pendingDeletions)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleCredit(id: string, action: 'approve' | 'deny') {
    setProcessing(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, reviewer: 'admin' }),
      })
      const data = await res.json()
      if (res.ok) {
        setCredits(prev => prev.filter(c => c.id !== id))
        showToast(action === 'approve'
          ? `Credit approved${data.stripe_credit_id ? ' & applied in Stripe ✓' : ' (no Stripe ID on file)'}`
          : 'Credit request denied')
      } else {
        showToast(data.error ?? 'Failed')
      }
    } finally {
      setProcessing(p => ({ ...p, [id]: false }))
    }
  }

  async function handleDeletion(id: string, action: 'approve' | 'deny') {
    setProcessing(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch('/api/admin/deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (res.ok) {
        setDeletions(prev => prev.filter(d => d.id !== id))
        showToast(action === 'approve' ? 'Data anonymized ✓' : 'Request denied')
      } else {
        showToast(data.error ?? 'Failed')
      }
    } finally {
      setProcessing(p => ({ ...p, [id]: false }))
    }
  }

  const tabs = [
    { key: 'credits', label: 'Credit Requests', count: credits.length },
    { key: 'deletions', label: 'Deletion Requests', count: deletions.length },
    { key: 'acceptances', label: 'TOS Acceptances', count: null },
  ] as const

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Legal & Compliance</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Credits', value: credits.length, color: credits.length > 0 ? 'text-orange-400' : 'text-green-400' },
          { label: 'Credits Approved', value: approvedCreditsCount, color: 'text-green-400' },
          { label: 'Opted-Out Leads', value: optedOutLeadsCount, color: 'text-yellow-400' },
          { label: 'Pending Deletions', value: deletions.length, color: deletions.length > 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'TOS Acceptances', value: totalAcceptances, color: 'text-blue-400' },
          { label: 'Missing TOS', value: contractorsWithoutTerms, color: contractorsWithoutTerms > 0 ? 'text-orange-400' : 'text-green-400' },
          { label: 'Credits Denied', value: deniedCreditsCount, color: 'text-gray-400' },
          { label: 'Deletions Completed', value: completedDeletionsCount, color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CREDIT REQUESTS ─────────────────────────────────────────── */}
      {activeTab === 'credits' && (
        <div>
          <p className="text-gray-500 text-sm mb-4">
            Pending credit requests from contractors. Approved credits are applied directly to the contractor's Stripe customer balance.
          </p>
          {credits.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 text-center text-gray-500">
              ✓ No pending credit requests
            </div>
          ) : (
            <div className="space-y-4">
              {credits.map(req => (
                <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-bold text-white">{req.contractors?.business_name ?? '—'}</p>
                      <p className="text-sm text-gray-500">{req.contractors?.contact_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-green-400">
                        {req.credit_amount ? `$${req.credit_amount.toFixed(2)}` : '—'}
                      </p>
                      <p className="text-xs text-gray-500">credit amount</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge label={REASON_LABELS[req.reason] ?? req.reason} color="bg-orange-500/15 text-orange-400" />
                    {req.leads && (
                      <Badge label={`${req.leads.niche} · ${req.leads.zip}`} color="bg-gray-700 text-gray-300" />
                    )}
                    {req.contractors?.stripe_customer_id ? (
                      <Badge label="Stripe customer ✓" color="bg-green-500/10 text-green-400" />
                    ) : (
                      <Badge label="No Stripe ID" color="bg-red-500/10 text-red-400" />
                    )}
                  </div>

                  {req.description && (
                    <p className="text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3 mb-3 italic">"{req.description}"</p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">{new Date(req.created_at).toLocaleString()}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCredit(req.id, 'deny')}
                        disabled={processing[req.id]}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => handleCredit(req.id, 'approve')}
                        disabled={processing[req.id]}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 transition-colors"
                      >
                        {processing[req.id] ? 'Processing...' : 'Approve + Apply Credit'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DELETION REQUESTS ───────────────────────────────────────── */}
      {activeTab === 'deletions' && (
        <div>
          <p className="text-gray-500 text-sm mb-4">
            CCPA data deletion requests. Approval anonymizes lead records and disables the user account. Records are never hard-deleted.
          </p>
          {deletions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 text-center text-gray-500">
              ✓ No pending deletion requests
            </div>
          ) : (
            <div className="space-y-3">
              {deletions.map(req => (
                <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{req.name || '(no name)'}</p>
                      <p className="text-sm text-gray-400">{req.email}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeletion(req.id, 'deny')}
                        disabled={processing[req.id]}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => handleDeletion(req.id, 'approve')}
                        disabled={processing[req.id]}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-colors"
                      >
                        {processing[req.id] ? 'Anonymizing...' : 'Approve & Anonymize'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TOS ACCEPTANCES ─────────────────────────────────────────── */}
      {activeTab === 'acceptances' && (
        <div>
          <p className="text-gray-500 text-sm mb-4">
            Most recent TOS acceptances. {contractorsWithoutTerms > 0 && (
              <span className="text-orange-400 font-semibold">{contractorsWithoutTerms} contractor{contractorsWithoutTerms !== 1 ? 's' : ''} have not accepted current terms.</span>
            )}
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Contractor</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Agreement</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Version</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">IP Address</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Accepted At</th>
                </tr>
              </thead>
              <tbody>
                {recentAcceptances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-600">No acceptances recorded yet</td>
                  </tr>
                ) : (
                  recentAcceptances.map(a => (
                    <tr key={a.id} className="border-b border-gray-800/50 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{a.contractors?.business_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{a.agreement_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <Badge label={`v${a.agreement_version}`} color="bg-blue-500/15 text-blue-400" />
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.ip_address ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(a.accepted_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 border-l-4 border-green-500 rounded-xl px-5 py-3.5 shadow-2xl z-50 animate-slide-up">
          <span className="text-sm text-white font-medium">{toast}</span>
        </div>
      )}

      <style>{`
        .animate-slide-up { animation: slideUp 0.25s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
