import { createAdminClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function AdminRevenuePage() {
  const admin = createAdminClient()
  const { data: claims } = await admin
    .from('lead_claims')
    .select(`*, contractors(business_name, plan_type)`)
    .order('claimed_at', { ascending: false })
    .limit(500)

  const totalRevenue = (claims ?? []).reduce((sum, c) => sum + (c.amount_charged ?? 0), 0)
  const pplRevenue = (claims ?? [])
    .filter(c => c.payment_type === 'pay_per_lead')
    .reduce((sum, c) => sum + (c.amount_charged ?? 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Revenue</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Total PPL Revenue</p>
          <p className="text-2xl font-black text-green-400">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">PPL Claims Count</p>
          <p className="text-2xl font-black text-orange-400">
            {(claims ?? []).filter(c => c.payment_type === 'pay_per_lead').length}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400">Contractor</th>
              <th className="text-left px-4 py-3 text-gray-400">Plan</th>
              <th className="text-left px-4 py-3 text-gray-400">Type</th>
              <th className="text-left px-4 py-3 text-gray-400">Amount</th>
              <th className="text-left px-4 py-3 text-gray-400">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(claims ?? []).map(claim => {
              const c = claim.contractors as any
              return (
                <tr key={claim.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white">{c?.business_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{c?.plan_type ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${
                      claim.payment_type === 'pay_per_lead' ? 'text-orange-400' : 'text-blue-400'
                    }`}>
                      {claim.payment_type === 'pay_per_lead' ? 'PPL' : 'Subscription'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-400">
                    {claim.amount_charged ? `$${claim.amount_charged}` : '$0'}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(claim.claimed_at).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
