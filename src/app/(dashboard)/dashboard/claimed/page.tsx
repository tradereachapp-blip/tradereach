import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
      leads (id, name, phone, zip, niche, description, callback_time, created_at)
    `)
    .eq('contractor_id', contractor.id)
    .order('claimed_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Claimed Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{claims?.length ?? 0} leads claimed total</p>
        </div>
        <a
          href="/api/leads/export"
          className="inline-flex items-center gap-2 bg-gray-800 border border-white/10 text-gray-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-white transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </a>
      </div>

      {!claims || claims.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-white/8 p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">No claimed leads yet</h3>
          <p className="text-gray-400">Claimed leads will appear here with full contact details.</p>
          <a href="/dashboard" className="mt-4 inline-block text-orange-400 font-medium hover:text-orange-300 transition-colors">
            Browse available leads →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const lead = claim.leads as any
            if (!lead) return null
            const phone = lead.phone
            const e164 = phone.length === 11 ? `+${phone}` : `+1${phone}`
            const formatted = `(${phone.slice(-10, -7)}) ${phone.slice(-7, -4)}-${phone.slice(-4)}`

            return (
              <div key={claim.id} className="bg-gray-900 rounded-xl border border-white/8 p-6 hover:border-white/15 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">{lead.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 mt-1">
                      {lead.niche}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-400">Claimed {new Date(claim.claimed_at).toLocaleDateString()}</div>
                    {claim.amount_charged ? (
                      <div className="text-orange-400 font-medium">${claim.amount_charged}</div>
                    ) : (
                      <div className="text-green-400 font-medium">Subscription</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Phone</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-white">{formatted}</span>
                      <a
                        href={`tel:${e164}`}
                        className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full transition-all"
                      >
                        📞 Call
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">ZIP Code</p>
                    <p className="font-mono font-semibold text-white">{lead.zip}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Best Time to Call</p>
                    <p className="text-gray-200">{lead.callback_time ?? 'Anytime'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Submitted</p>
                    <p className="text-gray-200">{new Date(lead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {lead.description && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-gray-300 text-sm bg-gray-800 border border-white/6 rounded-lg p-3">{lead.description}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
