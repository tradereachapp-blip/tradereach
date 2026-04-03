'use client'

import { useState } from 'react'

interface Lead {
  id: string
  created_at: string
  name: string
  zip: string
  niche: string
  status: string
  claimed_at: string | null
  contractors?: { business_name: string } | null
}

interface Props {
  leads: Lead[]
}

export default function AdminLeadsTable({ leads }: Props) {
  const [items, setItems] = useState(leads)
  const [filter, setFilter] = useState('')

  async function invalidateLead(leadId: string) {
    if (!confirm('Mark this lead as invalid? It will be removed from available leads.')) return
    const res = await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, status: 'invalid' }),
    })
    if (res.ok) {
      setItems(items.map(l => l.id === leadId ? { ...l, status: 'invalid' } : l))
    }
  }

  const filtered = filter
    ? items.filter(l =>
        l.name.toLowerCase().includes(filter.toLowerCase()) ||
        l.zip.includes(filter) ||
        l.niche.toLowerCase().includes(filter.toLowerCase()) ||
        l.status.includes(filter.toLowerCase())
      )
    : items

  const statusColors: Record<string, string> = {
    available: 'text-green-400',
    claimed: 'text-blue-400',
    expired: 'text-gray-400',
    invalid: 'text-red-400',
  }

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter by name, ZIP, niche, or status..."
        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">ZIP</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Niche</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Claimed By</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Submitted</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-white font-medium">{lead.name}</td>
                <td className="px-4 py-3 font-mono text-gray-300">{lead.zip}</td>
                <td className="px-4 py-3 text-gray-300">{lead.niche}</td>
                <td className={`px-4 py-3 font-semibold capitalize ${statusColors[lead.status] ?? 'text-gray-300'}`}>
                  {lead.status}
                </td>
                <td className="px-4 py-3 text-gray-400">{lead.contractors?.business_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(lead.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {lead.status === 'available' && (
                    <button
                      onClick={() => invalidateLead(lead.id)}
                      className="text-xs bg-red-900/50 hover:bg-red-900 text-red-400 px-2 py-1 rounded-md transition-colors"
                    >
                      Invalidate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
