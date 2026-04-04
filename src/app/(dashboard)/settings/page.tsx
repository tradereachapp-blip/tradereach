import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/dashboard/SettingsForm'

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors').select('*').eq('user_id', user.id).single()
  if (!contractor) redirect('/onboarding')

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>
      <SettingsForm contractor={contractor} userEmail={user.email ?? ''} />
    </div>
  )
}
