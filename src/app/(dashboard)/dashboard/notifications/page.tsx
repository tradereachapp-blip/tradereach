import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('id').eq('user_id', user.id).single()
  if (!contractor) redirect('/onboarding')

  const { data: notifications } = await admin
    .from('notifications')
    .select(`*, leads (zip, niche)`)
    .eq('contractor_id', contractor.id)
    .order('sent_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Notification History</h1>

      {!notifications || notifications.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-white/8 p-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-white mb-2">No notifications yet</h3>
          <p className="text-gray-400">You'll see all lead notifications here once you start receiving them.</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/60 border-b border-white/8">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {notifications.map((n) => {
                const lead = n.leads as any
                return (
                  <tr key={n.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        n.type === 'email'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          : 'bg-green-500/15 text-green-400 border border-green-500/20'
                      }`}>
                        {n.type === 'email' ? '📧 Email' : '📱 SMS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-200">
                      {lead ? `${lead.niche} in ${lead.zip}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        n.status === 'sent'
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      }`}>
                        {n.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(n.sent_at).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
