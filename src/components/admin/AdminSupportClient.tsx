'use client'

import { useState, useEffect, useCallback } from 'react'

interface Ticket {
  id: string
  created_at: string
  contractor_name: string
  contractor_email: string
  contractor_phone: string | null
  plan_type: string
  subject: string
  message: string
  source: string
  status: string
  priority: string
  resolved_at: string | null
  resolved_by: string | null
  admin_notes: string | null
  conversation_context: Array<{ role: string; content: string }> | null
}

interface Metrics {
  open: number
  in_progress: number
  resolved_today: number
  avg_response_hours: number | null
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  normal: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  low: 'bg-gray-700 text-gray-400 border-white/10',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-yellow-500/15 text-yellow-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  resolved: 'bg-green-500/15 text-green-400',
  closed: 'bg-gray-700 text-gray-500',
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

export default function AdminSupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter !== 'all') params.set('priority', priorityFilter)
    const res = await fetch(`/api/admin/support?${params}`)
    const data = await res.json()
    setTickets(data.tickets ?? [])
    setMetrics(data.metrics ?? null)
    setLoading(false)
  }, [statusFilter, priorityFilter])

  useEffect(() => { loadTickets() }, [loadTickets])

  async function doAction(id: string, action: string, extra: Record<string, string> = {}) {
    setProcessing(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...extra }),
      })
      if (res.ok) {
        await loadTickets()
        if (selectedTicket?.id === id) {
          if (action === 'resolve' || action === 'close') setSelectedTicket(null)
        }
        showToast(
          action === 'resolve' ? 'Ticket resolved & contractor notified ✓' :
          action === 'in_progress' ? 'Marked in progress' :
          action === 'urgent' ? 'Priority set to urgent' :
          action === 'close' ? 'Ticket closed' : 'Updated'
        )
      }
    } finally {
      setProcessing(p => ({ ...p, [id]: false }))
    }
  }

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Urgent', value: '' }, // priority filter shortcut
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Support Tickets</h1>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Open Tickets', value: metrics.open, color: metrics.open > 0 ? 'text-yellow-400' : 'text-green-400' },
            { label: 'In Progress', value: metrics.in_progress, color: 'text-blue-400' },
            { label: 'Resolved Today', value: metrics.resolved_today, color: 'text-green-400' },
            {
              label: 'Avg Response Time',
              value: metrics.avg_response_hours !== null ? `${metrics.avg_response_hours}h` : '—',
              color: 'text-orange-400',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                statusFilter === s ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {(['all', 'urgent', 'high', 'normal', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                priorityFilter === p ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500">✓ No tickets matching your filters</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Ticket</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Contractor</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Priority</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Created</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{t.subject}</p>
                    <p className="text-xs text-gray-500 font-mono">{t.id.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300">{t.contractor_name}</p>
                    <p className="text-xs text-gray-500">{t.contractor_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{t.plan_type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <Badge label={t.priority} color={PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.normal} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? ''}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setSelectedTicket(t); setAdminNotes(t.admin_notes ?? '') }}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      >
                        View
                      </button>
                      {t.status === 'open' && (
                        <button
                          onClick={() => doAction(t.id, 'in_progress')}
                          disabled={processing[t.id]}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                        >
                          {processing[t.id] ? '...' : 'In Progress'}
                        </button>
                      )}
                      {(t.status === 'open' || t.status === 'in_progress') && t.priority !== 'urgent' && (
                        <button
                          onClick={() => doAction(t.id, 'urgent')}
                          disabled={processing[t.id]}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                        >
                          Urgent
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedTicket(null)}>
          <div className="bg-gray-900 border border-white/12 rounded-2xl w-full max-w-2xl shadow-2xl mb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedTicket.contractor_name} · {selectedTicket.contractor_email}
                  {selectedTicket.contractor_phone && ` · ${selectedTicket.contractor_phone}`}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge label={selectedTicket.priority} color={PRIORITY_COLORS[selectedTicket.priority] ?? PRIORITY_COLORS.normal} />
                  <Badge label={selectedTicket.plan_type} color="bg-gray-700 text-gray-300 border-white/10" />
                  <Badge label={selectedTicket.source} color="bg-purple-500/15 text-purple-400 border-purple-500/30" />
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Message</p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.conversation_context && selectedTicket.conversation_context.length > 0 && (
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rex Conversation Context</p>
                  <div className="space-y-1.5">
                    {selectedTicket.conversation_context.map((m, i) => (
                      <div key={i} className={`text-xs rounded-lg px-3 py-2 ${m.role === 'user' ? 'bg-orange-500/10 text-orange-200' : 'bg-blue-500/10 text-blue-200'}`}>
                        <span className="font-semibold capitalize">{m.role}: </span>{m.content.slice(0, 200)}{m.content.length > 200 ? '…' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.admin_notes && (
                <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4">
                  <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Resolution Notes</p>
                  <p className="text-gray-300 text-sm">{selectedTicket.admin_notes}</p>
                </div>
              )}

              {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Resolution Notes (sent to contractor on resolve)</label>
                    <textarea
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      placeholder="Describe the resolution..."
                      rows={3}
                      className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    {selectedTicket.status === 'open' && (
                      <button
                        onClick={() => doAction(selectedTicket.id, 'in_progress')}
                        disabled={processing[selectedTicket.id]}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-blue-400 bg-blue-600/15 hover:bg-blue-600/25 transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => doAction(selectedTicket.id, 'resolve', { admin_notes: adminNotes })}
                      disabled={processing[selectedTicket.id]}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 transition-colors"
                    >
                      {processing[selectedTicket.id] ? 'Resolving...' : 'Mark Resolved + Notify Contractor'}
                    </button>
                    {selectedTicket.priority !== 'urgent' && (
                      <button
                        onClick={() => doAction(selectedTicket.id, 'urgent')}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-600/15 hover:bg-red-600/25 transition-colors"
                      >
                        Mark Urgent
                      </button>
                    )}
                  </div>
                </>
              )}

              <p className="text-xs text-gray-600">Ticket created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 border-l-4 border-green-500 rounded-xl px-5 py-3.5 shadow-2xl z-50">
          <span className="text-sm text-white font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}
