import { createAdminClient } from '@/lib/supabase/server'
import type { PlanType } from '@/types'

export interface ZipStatusResult {
  status: string
  canAdd: boolean
  claimType?: string
  badge?: string
  description: string
  upgradeSuggestion?: string
}

export async function getZipStatus(
  zip: string,
  niche: string,
  contractorId: string,
  planType: PlanType
): Promise<ZipStatusResult> {
  try {
    const admin = createAdminClient()

    // Get existing contractors in this ZIP
    const { data: existing } = await admin
      .from('zip_claims')
      .select('contractor_id, claim_type')
      .eq('zip', zip)
      .eq('niche', niche)
      .eq('is_active', true)

    const existingByType = {
      pro: (existing ?? []).filter(c => c.claim_type === 'available' || c.claim_type === 'available_with_warning').length,
      elite: (existing ?? []).filter(c => c.claim_type === 'exclusive' || c.claim_type === 'exclusive_locked').length,
      elitePlus: (existing ?? []).filter(c => c.claim_type === 'super_exclusive' || c.claim_type === 'super_exclusive_locked').length,
    }

    // Check if contractor already has this ZIP
    const alreadyOwns = existing?.some(c => c.contractor_id === contractorId)
    if (alreadyOwns) {
      return {
        status: 'ALREADY_ADDED',
        canAdd: false,
        description: 'You already have this ZIP code in your service area.',
      }
    }

    // Pro tier logic
    if (planType === 'pro' || planType === 'pay_per_lead') {
      if (existingByType.elitePlus > 0 || existingByType.elite > 0) {
        return {
          status: 'ELITE_LOCKED',
          canAdd: false,
          description: 'An Elite or Elite Plus contractor has priority in this ZIP. Upgrade to Elite to compete.',
          upgradeSuggestion: 'elite',
        }
      }

      if (existingByType.pro >= 3) {
        return {
          status: 'PRO_CAPACITY_REACHED',
          canAdd: true,
          claimType: 'available',
          badge: 'Shared with 3 Pro',
          description: 'This ZIP already has 3 Pro contractors. You can still add it, but leads will be shared.',
        }
      }

      return {
        status: 'AVAILABLE_EXCLUSIVELY',
        canAdd: true,
        claimType: 'available',
        badge: existingByType.pro === 0 ? 'You First' : `Shared with ${existingByType.pro} Pro`,
        description: existingByType.pro === 0 ? 'You will be the first in this ZIP!' : `Shared lead routing with ${existingByType.pro} other Pro contractors.`,
      }
    }

    // Elite tier logic
    if (planType === 'elite') {
      if (existingByType.elitePlus > 0) {
        return {
          status: 'SUPER_EXCLUSIVE_LOCKED',
          canAdd: false,
          description: 'An Elite Plus contractor has super-exclusive priority in this ZIP. Only Elite Plus can claim.',
          upgradeSuggestion: 'elite_plus',
        }
      }

      if (existingByType.elite > 0) {
        return {
          status: 'ELITE_EXCLUSIVE_LOCKED',
          canAdd: false,
          description: 'Another Elite contractor already has exclusive claim to this ZIP.',
        }
      }

      if (existingByType.pro > 0) {
        return {
          status: 'PRO_EXIST',
          canAdd: true,
          claimType: 'exclusive',
          badge: 'Exclusive (Pro downgrade)',
          description: `You will claim exclusive territory, overriding ${existingByType.pro} Pro contractors. They will be notified.`,
        }
      }

      return {
        status: 'AVAILABLE_EXCLUSIVELY',
        canAdd: true,
        claimType: 'exclusive',
        badge: 'Exclusive Territory',
        description: 'You will have exclusive claim to all leads in this ZIP.',
      }
    }

    // Elite Plus tier logic
    if (planType === 'elite_plus') {
      if (existingByType.elitePlus > 0) {
        return {
          status: 'SUPER_EXCLUSIVE_LOCKED',
          canAdd: false,
          description: 'Another Elite Plus contractor already has super-exclusive priority in this ZIP.',
        }
      }

      let claimType = 'super_exclusive'
      let description = 'You will have super-exclusive priority. All leads route to you first.'
      let badge = 'Super Exclusive'

      if (existingByType.elite > 0) {
        claimType = 'super_exclusive' // Still super exclusive, but will override elite
        description = `You will claim super-exclusive territory, overriding ${existingByType.elite} Elite contractor(s). They will be notified.`
        badge = 'Super Exclusive (override)'
      }

      if (existingByType.pro > 0) {
        description = `You will claim super-exclusive territory with top priority over ${existingByType.pro} Pro contractor(s).`
      }

      return {
        status: 'AVAILABLE_EXCLUSIVELY',
        canAdd: true,
        claimType,
        badge,
        description,
      }
    }

    return {
      status: 'UNKNOWN',
      canAdd: false,
      description: 'Unable to determine eligibility for this ZIP.',
    }
  } catch (err) {
    return {
      status: 'ERROR',
      canAdd: false,
      description: 'Error checking ZIP availability. Please try again.',
    }
  }
}
