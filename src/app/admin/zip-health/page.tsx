import { createAdminClient } from '@/lib/supabase/server'

export const revalidate = 0

interface ZipCapacity {
  id: string
  zip_code: string
  niche: string
  max_pro_count: number
  current_pro_count: number
  max_elite_count: number
  current_elite_count: number
  max_elite_plus_count: number
  current_elite_plus_count: number
  is_oversaturated: boolean
  leads_last_30_days: number
}

export default async function ZipHealthPage() {
  const admin = createAdminClient()

  const { data: zipCapacities = [] } = await admin
    .from('zip_capacity')
    .select('*')
    .order('is_oversaturated', { ascending: false })
    .order('current_pro_count', { ascending: false })

  const oversaturatedCount = (zipCapacities as ZipCapacity[]).filter(z => z.is_oversaturated).length

  // Group by niche for filtering
  const niches = Array.from(new Set((zipCapacities as ZipCapacity[]).map(z => z.niche))).sort()

  // Helper function to calculate capacity percentage
  const getCapacityPercentage = (current: number, max: number) => {
    return max > 0 ? (current / max) * 100 : 0
  }

  // Helper function to get color based on percentage
  const getCapacityColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-600 text-red-50'
    if (percentage >= 80) return 'bg-orange-600 text-orange-50'
    if (percentage >= 50) return 'bg-yellow-600 text-yellow-50'
    return 'bg-green-600 text-green-50'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">ZIP Code Health Dashboard</h1>
        <p className="text-gray-400">Monitor contractor saturation and lead capacity by ZIP code</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total ZIPs Monitored</p>
          <p className="text-3xl font-black text-blue-400">{zipCapacities.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-red-500/20">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Oversaturated ZIPs</p>
          <p className="text-3xl font-black text-red-400">{oversaturatedCount}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-green-500/20">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Healthy ZIPs</p>
          <p className="text-3xl font-black text-green-400">{zipCapacities.length - oversaturatedCount}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Leads (Last 30d)</p>
          <p className="text-3xl font-black text-purple-400">
            {(zipCapacities as ZipCapacity[]).reduce((sum, z) => sum + z.leads_last_30_days, 0)}
          </p>
        </div>
      </div>

      {/* Color Legend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-gray-300 mb-3">Capacity Legend</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-xs text-gray-400">&lt;50% Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-600" />
            <span className="text-xs text-gray-400">50-80% Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600" />
            <span className="text-xs text-gray-400">80-100% Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-xs text-gray-400">&gt;100% Full</span>
          </div>
        </div>
      </div>

      {/* ZIP Health Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">ZIP Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Niche</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Pro</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Elite</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Elite Plus</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Leads (30d)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(zipCapacities as ZipCapacity[]).map((zip) => {
                const proPercentage = getCapacityPercentage(zip.current_pro_count, zip.max_pro_count)
                const elitePercentage = getCapacityPercentage(zip.current_elite_count, zip.max_elite_count)
                const elitePlusPercentage = getCapacityPercentage(zip.current_elite_plus_count, zip.max_elite_plus_count)

                return (
                  <tr key={zip.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-white text-lg">{zip.zip_code}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{zip.niche}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCapacityColor(proPercentage)}`}>
                          {zip.current_pro_count}/{zip.max_pro_count}
                        </span>
                        <div className="w-20 bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              proPercentage > 100 ? 'bg-red-500' : proPercentage >= 80 ? 'bg-orange-500' : proPercentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(proPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCapacityColor(elitePercentage)}`}>
                          {zip.current_elite_count}/{zip.max_elite_count}
                        </span>
                        <div className="w-20 bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              elitePercentage > 100 ? 'bg-red-500' : elitePercentage >= 80 ? 'bg-orange-500' : elitePercentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(elitePercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCapacityColor(elitePlusPercentage)}`}>
                          {zip.current_elite_plus_count}/{zip.max_elite_plus_count}
                        </span>
                        <div className="w-20 bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              elitePlusPercentage > 100 ? 'bg-red-500' : elitePlusPercentage >= 80 ? 'bg-orange-500' : elitePlusPercentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(elitePlusPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{zip.leads_last_30_days}</p>
                    </td>
                    <td className="px-6 py-4">
                      {zip.is_oversaturated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-xs font-medium text-red-300">
                          🔴 Oversaturated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-xs font-medium text-green-300">
                          🟢 Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {zip.is_oversaturated && (
                        <button className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg">
                          Increase Ad Spend
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-6 flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700">
          📥 Export to CSV
        </button>
      </div>
    </div>
  )
}
