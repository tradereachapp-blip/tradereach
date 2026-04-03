import { createAdminClient } from '@/lib/supabase/server'
import AdminContractorsTable from './AdminContractorsTable'

export const revalidate = 0

export default async function AdminContractorsPage() {
  const admin = createAdminClient()
  const { data: contractors } = await admin
    .from('contractors')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">All Contractors</h1>
      <AdminContractorsTable contractors={contractors ?? []} />
    </div>
  )
}
