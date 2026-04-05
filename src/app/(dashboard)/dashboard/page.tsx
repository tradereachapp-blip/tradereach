import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import AvailableLeadsTable from '@/components/dashboard/AvailableLeadsTable'
import PlanStatusBanner from '@/components/dashboard/PlanStatusBanner'
import LeadAlertSiren from '@/components/dashboard/LeadAlertSiren'
import type { Contractor, Lead } from '@/types'
import { ELITE_PRIORITY_WINDOW_MINUTES } from '@/lib/config'

export const revalidate = 0 // Always fresh

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('*').eq('user_id', user.id).single()

  if (!contractor || !contractor.onboarding_complete) {
    redirect('/onboarding')
  }

  const isActive =
    contractor.plan_type === 'pay_per_lead' ||
    ['active', 'trialing'].includes(contractor.subscription_status)

  const safeZipCodes = contractor.zip_codes ?? []
  const safeNiche = contractor.niche ?? ''

  let leads: Lead[] = []
  if (isActive && safeZipCodes.length > 0) {
    const now = new Date()
    const eliteWindowStart = new Date(now.getTime() - ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000)

    let query = admin
      .from('leads')
      .select('*')
      .eq('status', 'available')
      .eq('niche', safeNiche)
      .in('zip', safeZipCodes)
      .order('created_at', { ascending: false })

    if (contractor.plan_type !== 'elite') {
      query = query.lt('created_at', eliteWindowStart.toISOString())
    }

    const { data } = await query
    leads = data ?? []
  }

  return (
    <div>
      {/* Real-time lead alert siren */}
      <LeadAlertSiren
        contractorId={contractor.id}
        niche={safeNiche}
        zipCodes={safeZipCodes}
        isElite={contractor.plan_type === 'elite'}
        initialLeadIds={leads.map(l => l.id)}
        alertSound={contractor.alert_sound ?? 'siren'}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Available Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {safeNiche} · {safeZipCodes.length} ZIP{safeZipCodes.length !== 1 ? 's' : ''} covered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <PlanStatusBanner contractor={contractor} />

      {!isActive ? (
        <div className="bg-gray-900 border border-white/8 rounded-2xl text-center py-16 px-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-white mb-2">Subscription Inactive</h3>
          <p className="text-gray-500 mb-6 text-sm">
            Your subscription is {contractor.subscription_status}. Update your billing to receive leads.
          </p>
          <a href="/settings" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm">
            Manage Subscription →
          </a>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-gray-900 border border-white/8 rounded-2xl text-center py-16 px-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/8">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No leads right now</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            You'll get an alert the moment a new lead comes in for your area. Keep this tab open.
          </p>
        </div>
      ) : (
        <AvailableLeadsTable
          leads={leads}
          contractor={contractor}
        />
      )}
    </div>
  )
}
