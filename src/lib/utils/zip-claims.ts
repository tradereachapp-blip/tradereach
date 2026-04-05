import { createAdminClient } from '@/lib/supabase/server'
import type { ZipClaimType, PlanType } from '@/types'

export async function recordZipClaim(
  contractorId: string,
  zip: string,
  niche: string,
  claimType: ZipClaimType,
  planType: PlanType
) {
  try {
    const admin = createAdminClient()

    // Insert or update zip_claims
    await admin.from('zip_claims').upsert(
      {
        contractor_id: contractorId,
        zip,
        niche,
        claim_type: claimType,
        is_active: true,
        claimed_at: new Date().toISOString(),
      },
      { onConflict: 'contractor_id,zip,niche' }
    )

    // Update contractor's exclusive_zips array if needed
    if (claimType === 'exclusive' || claimType === 'super_exclusive') {
      const { data: contractor } = await admin
        .from('contractors')
        .select('exclusive_zips')
        .eq('id', contractorId)
        .single()

      const exclusiveZips = contractor?.exclusive_zips ?? []
      if (!exclusiveZips.includes(zip)) {
        await admin
          .from('contractors')
          .update({ exclusive_zips: [...exclusiveZips, zip] })
          .eq('id', contractorId)
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function releaseZipClaim(
  contractorId: string,
  zip: string,
  niche: string
) {
  try {
    const admin = createAdminClient()

    // Mark as inactive
    await admin
      .from('zip_claims')
      .update({ is_active: false })
      .eq('contractor_id', contractorId)
      .eq('zip', zip)
      .eq('niche', niche)

    // Remove from exclusive_zips
    const { data: contractor } = await admin
      .from('contractors')
      .select('exclusive_zips')
      .eq('id', contractorId)
      .single()

    const exclusiveZips = (contractor?.exclusive_zips ?? []).filter((z: string) => z !== zip)
    await admin
      .from('contractors')
      .update({ exclusive_zips: exclusiveZips })
      .eq('id', contractorId)

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
