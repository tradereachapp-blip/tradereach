import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import PlanStatusBanner from '@/components/dashboard/PlanStatusBanner'
import ClaimedLeadsClient from '@/components/dashboard/ClaimedLeadsClient'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function ClaimedLeadsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contractor } = await supabase
    .from('contractors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!contractor) redirect('/onboarding')

  const { data: claims } = await supabase
    .from('lead_claims')
    .select(`
      id, claimed_at, payment_type, amount_charged, lead_status, notes,
      job_value, follow_up_date, contact_attempts,
      leads ( id, name, phone, zip, niche, description, callback_time, created_at )
    `)
    .eq('contractor_id', contractor.id)
    .order('claimed_at', { ascending: false })

  const safeClaims = (claims ?? []).filter(c => c.leads !== null)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardNav contractor={contractor} />
      <PlanStatusBanner contractor={contractor} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Claimed Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Track your leads and update their status as you work them.</p>
        </div>
        <Suspense fallback={<div className="text-gray-500 text-sm py-8 text-center">Loading...</div>}>
          <ClaimedLeadsClient initialClaims={safeClaims} />
        </Suspense>
      </main>
    </div>
  )
}
