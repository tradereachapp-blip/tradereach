import { createAdminClient } from '@/lib/supabase/server'
import AdminLeadsTable from './AdminLeadsTable'

export const revalidate = 0

export default async function AdminLeadsPage() {
  const admin = createAdminClient()
  const { data: leads } = await admin
    .from('leads')
    .select('*, contractors(business_name, contact_name)')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">All Leads</h1>
      <AdminLeadsTable leads={leads ?? []} />
    </div>
  )
}
