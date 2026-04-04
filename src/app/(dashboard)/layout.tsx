import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/dashboard/DashboardNav'

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

  // Get contractor data server-side
  const admin = createAdminClient()
  const { data: contractor } = await admin
    .from('contractors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Redirect to onboarding if incomplete (skip for onboarding page itself)
  // This is handled by middleware but we double-check here

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardNav contractor={contractor} userEmail={user.email ?? ''} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
