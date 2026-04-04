// ============================================================
// Reusable ZIP code matching utility
// Called from multiple places — do not inline this logic
// ============================================================

import { createAdminClient } from '@/lib/supabase/server'
import type { Contractor, Niche } from '@/types'

/**
 * Find all contractors that match a given niche and zip code.
 * Only returns contractors with active/trialing subscriptions or pay_per_lead plan.
 */
export async function findMatchingContractors(
  niche: Niche,
  zip: string
): Promise<Contractor[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .eq('niche', niche)
    .contains('zip_codes', [zip])
    .or(
      'subscription_status.in.(active,trialing),plan_type.eq.pay_per_lead'
    )

  if (error) {
    console.error('[zip-matching] Error finding contractors:', error)
    return []
  }

  // Filter: pay_per_lead contractors don't need subscription status check
  // Pro/Elite contractors need active or trialing
  return (data ?? []).filter((c) => {
    if (c.plan_type === 'pay_per_lead') return true
    if (c.plan_type === 'none') return false
    return ['active', 'trialing'].includes(c.subscription_status)
  })
}

/**
 * Split contractors into Elite and non-Elite groups.
 */
export function splitByPriority(contractors: Contractor[]): {
  elite: Contractor[]
  others: Contractor[]
} {
  return {
    elite: contractors.filter((c) => c.plan_type === 'elite'),
    others: contractors.filter((c) => c.plan_type !== 'elite'),
  }
}
