import { createAdminClient } from '@/lib/supabase/server'
import SystemStatusPanel from '@/components/admin/SystemStatusPanel'
import { PRICING } from '@/lib/pricing'

export const revalidate = 0

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: leadsToday },
    { count: leadsWeek },
    { count: leadsMonth },
    { count: totalContractors },
    { data: subscribers },
    { data: pplClaims },
    { data: zipCapacities },
    { data: allContractors },
  ] = await Promise.all([
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    admin.from('contractors').select('*', { count: 'exact', head: true }),
    admin.from('contractors').select('plan_type, subscription_status').in('subscription_status', ['active', 'trialing']),
    admin.from('lead_claims').select('amount_charged').eq('payment_type', 'pay_per_lead').gte('claimed_at', monthStart),
    admin.from('zip_capacity').select('*'),
    admin.from('contractors').select('plan_type, founding_member'),
  ])

  const proCount = subscribers?.filter(s => s.plan_type === 'pro').length ?? 0
  const eliteCount = subscribers?.filter(s => s.plan_type === 'elite').length ?? 0
  const pplRevenue = (pplClaims ?? []).reduce((sum, c) => sum + (c.amount_charged ?? 0), 0)
  const mrr = proCount * PRICING.PRO_MONTHLY + eliteCount * PRICING.ELITE_MONTHLY

  // New stats
  const oversaturatedZips = (zipCapacities ?? []).filter((z: any) => z.is_oversaturated).length
  const foundingProCount = (allContractors ?? []).filter((c: any) => c.plan_type === 'pro' && c.founding_member).length
  const foundingEliteCount = (allContractors ?? []).filter((c: any) => c.plan_type === 'elite' && c.founding_member).length
  const elitePlusCount = subscribers?.filter(s => s.plan_type === 'elite_plus').length ?? 0

  // Credit transactions (using lead_claims that charged credits)
  const creditTransactions = pplClaims?.length ?? 0

  const stats = [
    { label: 'Leads Today', value: leadsToday ?? 0, color: 'text-blue-400' },
    { label: 'Leads This Week', value: leadsWeek ?? 0, color: 'text-blue-400' },
    { label: 'Leads This Month', value: leadsMonth ?? 0, color: 'text-blue-400' },
    { label: 'Total Contractors', value: totalContractors ?? 0, color: 'text-green-400' },
    { label: 'Pro Subscribers', value: proCount, color: 'text-blue-400' },
    { label: 'Elite Subscribers', value: eliteCount, color: 'text-purple-400' },
    { label: 'Elite Plus Subscribers', value: elitePlusCount, color: 'text-yellow-400' },
    { label: 'MRR', value: `$${mrr.toLocaleString()}`, color: 'text-green-400' },
    { label: 'PPL Revenue (Month)', value: `$${pplRevenue.toFixed(2)}`, color: 'text-orange-400' },
    { label: 'Credit Claims Today', value: creditTransactions, color: 'text-cyan-400' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Business Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* New Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* ZIP Health Summary */}
        <a
          href="/admin/zip-health"
          className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-red-500 transition-colors group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-2">ZIP Code Health</p>
              <h3 className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors mb-1">
                {oversaturatedZips} ZIPs Oversaturated
              </h3>
              <p className="text-gray-400 text-sm">
                {zipCapacities?.length ?? 0} total ZIPs monitored
              </p>
            </div>
            <div className="text-3xl">🗺️</div>
          </div>
          <p className="text-orange-400 text-sm font-medium mt-4">View Dashboard →</p>
        </a>

        {/* Founding Member Allocation */}
        <div className="bg-gray-900 rounded-xl p-6 border border-yellow-500/20">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-2">Founding Members</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-yellow-300">{foundingProCount}/10</p>
              <p className="text-gray-400 text-sm">Pro Spots Filled</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-300">{foundingEliteCount}/5</p>
              <p className="text-gray-400 text-sm">Elite Spots Filled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <a href="/admin/leads" className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-orange-500 transition-colors group">
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">Manage Leads</h3>
          <p className="text-gray-400 text-sm">View, invalidate, and monitor all leads</p>
        </a>
        <a href="/admin/contractors" className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-orange-500 transition-colors group">
          <div className="text-2xl mb-2">👷</div>
          <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">Manage Contractors</h3>
          <p className="text-gray-400 text-sm">View accounts, adjust plans manually</p>
        </a>
        <a href="/admin/errors" className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-red-500 transition-colors group">
          <div className="text-2xl mb-2">🚨</div>
          <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">Error Log</h3>
          <p className="text-gray-400 text-sm">System errors and coverage gaps</p>
        </a>
      </div>

      {/* System Status Dashboard – Client Component with Rex + live status */}
      <SystemStatusPanel />
    </div>
  )
}
