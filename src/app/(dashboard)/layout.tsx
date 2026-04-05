import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/dashboard/DashboardNav'
import ChatBot from '@/components/ChatBot'
import { RexProvider } from '@/context/RexContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()

  // Try to resolve contractor for this user.
  // Owners: direct match. Team members: resolve via team_members table.
  let contractor = null

  const { data: ownerContractor } = await admin
    .from('contractors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (ownerContractor) {
    contractor = ownerContractor
  } else {
    // Check if this user is an active team member
    const { data: membership } = await admin
      .from('team_members')
      .select('owner_contractor_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membership) {
      const { data: ownerC } = await admin
        .from('contractors')
        .select('*')
        .eq('id', membership.owner_contractor_id)
        .single()
      contractor = ownerC
    }
  }

  return (
    <RexProvider>
      <div className="min-h-screen bg-gray-950 text-white">
        <DashboardNav contractor={contractor} userEmail={user.email ?? ''} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        {/* Rex AI Support Chat — appears on every dashboard page */}
        <ChatBot
          contractorName={contractor?.contact_name ?? null}
          contractorId={user.id}
        />
      </div>
    </RexProvider>
  )
}
