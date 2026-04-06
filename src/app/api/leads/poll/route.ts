import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ELITE_PRIORITY_WINDOW_MINUTES } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: contractor } = await admin
      .from('contractors')
      .select('id, niche, zip_codes, plan_type, subscription_status, onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (!contractor?.onboarding_complete) {
      return Response.json({ leads: [] })
    }

    const isActive =
      contractor.plan_type === 'pay_per_lead' ||
      ['active', 'trialing'].includes(contractor.subscription_status ?? '')

    if (!isActive || !contractor.zip_codes?.length) {
      return Response.json({ leads: [] })
    }

    const now = new Date()
    const eliteWindowStart = new Date(now.getTime() - ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000)

    let query = admin
      .from('leads')
      .select('id, name, niche, zip, created_at, callback_time')
      .eq('status', 'available')
      .eq('niche', contractor.niche)
      .in('zip', contractor.zip_codes)
      .order('created_at', { ascending: false })
      .limit(20)

    if (contractor.plan_type !== 'elite' && contractor.plan_type !== 'elite_plus') {
      query = query.lt('created_at', eliteWindowStart.toISOString())
    }

    const { data: leads } = await query

    return Response.json({ leads: leads ?? [] })
  } catch {
    return Response.json({ leads: [] })
  }
}
