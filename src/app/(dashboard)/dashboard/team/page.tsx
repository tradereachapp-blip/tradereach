import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import TeamManagementClient from '@/components/dashboard/TeamManagementClient'

export const revalidate = 0

export default async function TeamPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('*').eq('user_id', user.id).single()

  // Team members can't manage the team — only the owner can
  if (!contractor) redirect('/dashboard')

  const { data: members } = await admin
    .from('team_members')
    .select('*')
    .eq('owner_contractor_id', contractor.id)
    .order('created_at', { ascending: true })

  const isElite = contractor.plan_type === 'elite'
  const activeCount = (members ?? []).filter(m => m.status === 'active').length
  const freeSlots = isElite ? Math.max(0, 1 - activeCount) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Team Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Invite your team — they'll share your leads dashboard
        </p>
      </div>
      <TeamManagementClient
        initialMembers={members ?? []}
        isElite={isElite}
        freeSlots={freeSlots}
        planType={contractor.plan_type}
      />
    </div>
  )
}
