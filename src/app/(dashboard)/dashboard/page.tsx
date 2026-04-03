import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import AvailableLeadsTable from '@/components/dashboard/AvailableLeadsTable'
import PlanStatusBanner from '@/components/dashboard/PlanStatusBanner'
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

  // Check if subscription is still valid
  const isActive =
    contractor.plan_type === 'pay_per_lead' ||
    ['active', 'trialing'].includes(contractor.subscription_status)

  // Fetch available leads matching contractor niche and zip codes
  let leads: Lead[] = []
  if (isActive && contractor.zip_codes.length > 0) {
    const now = new Date()
    const eliteWindowStart = new Date(now.getTime() - ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000)

    let query = admin
      .from('leads')
      .select('*')
      .eq('status', 'available')
      .eq('niche', contractor.niche)
      .in('zip', contractor.zip_codes)
      .order('created_at', { ascending: false })

    // Non-Elite: hide leads still in priority window
    if (contractor.plan_type !== 'elite') {
      query = query.lt('created_at', eliteWindowStart.toISOString())
    }

    const { data } = await query
    leads = data ?? []
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Leads</h1>
        <p className="text-gray-500 text-sm mt-1">
          Leads matching your niche ({contractor.niche}) and service area
        </p>
      </div>

      <PlanStatusBanner contractor={contractor} />

      {!isActive ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Inactive</h3>
          <p className="text-gray-500 mb-4">
            Your subscription is {contractor.subscription_status}. Update your billing to receive leads.
          </p>
          <a href="/settings" className="btn-primary">
            Manage Subscription
          </a>
        </div>
      ) : leads.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads available right now</h3>
          <p className="text-gray-500">
            We'll notify you instantly via SMS and email when a new lead comes in.
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
