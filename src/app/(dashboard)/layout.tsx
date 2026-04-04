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
  const { data: contractor } = await admin
    .from('contractors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const contractorFirstName = contractor?.contact_name?.split(' ')[0] ?? null

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
