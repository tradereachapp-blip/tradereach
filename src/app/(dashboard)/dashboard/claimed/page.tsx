import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import ClaimedLeadsClient from '@/components/dashboard/ClaimedLeadsClient'

export const revalidate = 0

export default async function ClaimedLeadsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) redirect('/onboarding')

  const { data: claims } = await admin
    .from('lead_claims')
    .select(`
      id, claimed_at, payment_type, amount_charged,
      lead_status, notes, job_value, follow_up_date, contact_attempts,
      leads (id, name, phone, zip, niche, description, callback_time, created_at)
    `)
    .eq('contractor_id', contractor.id)
    .order('claimed_at', { ascending: false })

  const safeClaims = (claims ?? []).map((c: any) => ({
    ...c,
    lead_status: c.lead_status ?? 'New',
    notes: c.notes ?? null,
    job_value: c.job_value ?? null,
    follow_up_date: c.follow_up_date ?? null,
    contact_attempts: c.contact_attempts ?? 0,
    leads: c.leads as any,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Claimed Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">{safeClaims.length} leads claimed total</p>
        </div>
        <a
          href="/api/leads/export"
          className="inline-flex items-center gap-2 bg-gray-800 border border-white/10 text-gray-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-white transition-all text-sm hover:scale-[1.02]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </a>
      </div>

      <ClaimedLeadsClient initialClaims={safeClaims} />
    </div>
  )
}
