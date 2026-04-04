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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification History</h1>

      {!notifications || notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-500">You'll see all lead notifications here once you start receiving them.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const lead = n.leads as any
                return (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        n.type === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {n.type === 'email' ? '📧 Email' : '📱 SMS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lead ? `${lead.niche} in ${lead.zip}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        n.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {n.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
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
