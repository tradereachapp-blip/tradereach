import { createAdminClient } from '@/lib/supabase/server'
import SystemStatusPanel from '@/components/admin/SystemStatusPanel'

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
  ] = await Promise.all([
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    admin.from('contractors').select('*', { count: 'exact', head: true }),
    admin.from('contractors').select('plan_type, subscription_status').in('subscription_status', ['active', 'trialing']),
    admin.from('lead_claims').select('amount_charged').eq('payment_type', 'pay_per_lead').gte('claimed_at', monthStart),
  ])

  const proCount = subscribers?.filter(s => s.plan_type === 'pro').length ?? 0
  const eliteCount = subscribers?.filter(s => s.plan_type === 'elite').length ?? 0
  const pplRevenue = (pplClaims ?? []).reduce((sum, c) => sum + (c.amount_charged ?? 0), 0)
  const mrr = proCount * 397 + eliteCount * 697

  const stats = [
    { label: 'Leads Today', value: leadsToday ?? 0, color: 'text-blue-400' },
    { label: 'Leads This Week', value: leadsWeek ?? 0, color: 'text-blue-400' },
    { label: 'Leads This Month', value: leadsMonth ?? 0, color: 'text-blue-400' },
    { label: 'Total Contractors', value: totalContractors ?? 0, color: 'text-green-400' },
    { label: 'Pro Subscribers', value: proCount, color: 'text-blue-400' },
    { label: 'Elite Subscribers', value: eliteCount, color: 'text-purple-400' },
    { label: 'MRR', value: `$${mrr.toLocaleString()}`, color: 'text-green-400' },
    { label: 'PPL Revenue (Month)', value: `$${pplRevenue.toFixed(2)}`, color: 'text-orange-400' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Business Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
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

      {/* System Status Dashboard — Client Component with Rex + live status */}
      <SystemStatusPanel />
    </div>
  )
}
