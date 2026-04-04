import { createAdminClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function AdminErrorsPage() {
  const admin = createAdminClient()
  const { data: errors } = await admin
    .from('errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Error Log</h1>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Message</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Context</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(errors ?? []).map(err => (
              <tr key={err.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono font-semibold ${
                    err.type?.includes('gap') ? 'text-yellow-400' :
                    err.type?.includes('info') ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {err.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{err.message}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                  {err.context ? (
                    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(err.context, null, 0)}</pre>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(err.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
