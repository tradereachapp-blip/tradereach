import { createAdminClient } from '@/lib/supabase/server'
import AdminLegalClient from '@/components/admin/AdminLegalClient'

export const revalidate = 0

export default async function AdminLegalPage() {
  const admin = createAdminClient()

  const [
    { data: pendingCredits },
    { count: approvedCredits },
    { count: deniedCredits },
    { data: pendingDeletions },
    { count: completedDeletions },
    { count: optedOutLeads },
    { count: totalAcceptances },
    { count: contractorsWithoutTerms },
    { data: recentAcceptances },
  ] = await Promise.all([
    admin.from('credit_requests')
      .select('*, contractors(business_name, contact_name, stripe_customer_id), leads(name, zip, niche)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    admin.from('credit_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('credit_requests').select('*', { count: 'exact', head: true }).eq('status', 'denied'),
    admin.from('deletion_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    admin.from('deletion_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('leads').select('*', { count: 'exact', head: true }).eq('opted_out', true),
    admin.from('legal_acceptances').select('*', { count: 'exact', head: true }),
    admin.from('contractors')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(SELECT contractor_id FROM legal_acceptances WHERE agreement_type = 'contractor_tos' AND agreement_version = '1.0')`),
    admin.from('legal_acceptances')
      .select('*, contractors(business_name)')
      .order('accepted_at', { ascending: false })
      .limit(10),
  ])

  return (
    <AdminLegalClient
      pendingCredits={pendingCredits ?? []}
      approvedCreditsCount={approvedCredits ?? 0}
      deniedCreditsCount={deniedCredits ?? 0}
      pendingDeletions={pendingDeletions ?? []}
      completedDeletionsCount={completedDeletions ?? 0}
      optedOutLeadsCount={optedOutLeads ?? 0}
      totalAcceptances={totalAcceptances ?? 0}
      contractorsWithoutTerms={contractorsWithoutTerms ?? 0}
      recentAcceptances={recentAcceptances ?? []}
    />
  )
}
