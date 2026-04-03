'use client'

import { useState } from 'react'

interface Contractor {
  id: string
  created_at: string
  business_name: string
  contact_name: string
  niche: string
  plan_type: string
  subscription_status: string
  leads_used_this_month: number
  zip_codes: string[]
}

interface Props {
  contractors: Contractor[]
}

export default function AdminContractorsTable({ contractors }: Props) {
  const [items, setItems] = useState(contractors)

  async function updatePlan(contractorId: string, planType: string) {
    const res = await fetch('/api/admin/contractors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractor_id: contractorId, plan_type: planType }),
    })
    if (res.ok) {
      setItems(items.map(c => c.id === contractorId ? { ...c, plan_type: planType } : c))
    }
  }

  const statusColors: Record<string, string> = {
    active: 'text-green-400',
    trialing: 'text-blue-400',
    past_due: 'text-red-400',
    canceled: 'text-gray-400',
    inactive: 'text-gray-500',
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Business</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Niche</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Plan</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Leads/Mo</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">ZIPs</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium">Joined</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Adjust Plan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {items.map(c => (
            <tr key={c.id} className="hover:bg-gray-800/50">
              <td className="px-4 py-3 text-white">
                <div className="font-medium">{c.business_name}</div>
                <div className="text-xs text-gray-400">{c.contact_name}</div>
              </td>
              <td className="px-4 py-3 text-gray-300">{c.niche}</td>
              <td className="px-4 py-3">
                <span className="font-semibold text-gray-200 capitalize">
                  {c.plan_type === 'pay_per_lead' ? 'PPL' : c.plan_type}
                </span>
              </td>
              <td className={`px-4 py-3 capitalize font-medium ${statusColors[c.subscription_status] ?? 'text-gray-300'}`}>
                {c.subscription_status}
              </td>
              <td className="px-4 py-3 text-gray-300">{c.leads_used_this_month}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">{c.zip_codes.join(', ')}</td>
              <td className="px-4 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <select
                  value={c.plan_type}
                  onChange={e => updatePlan(c.id, e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-md px-2 py-1 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="pay_per_lead">Pay Per Lead</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
