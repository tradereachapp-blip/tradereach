import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, structuredError } from '@/lib/utils/error-logger'

export const dynamic = 'force-dynamic'

// Cron: daily at 7am UTC
// Monitor ZIP capacity and mark as oversaturated if needed

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return structuredError('Unauthorized', 401)
  }

  try {
    const admin = createAdminClient()
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get all ZIP codes with contractors
    const { data: zipClaims } = await admin
      .from('zip_claims')
      .select('zip, niche, claim_type')
      .eq('is_active', true)

    const zipNichePairs = Array.from(
      new Set((zipClaims ?? []).map(c => `${c.zip}|${c.niche}`))
    )

    let updated = 0

    for (const pair of zipNichePairs) {
      try {
        const [zip, niche] = pair.split('|')

        // Count contractors by plan type
        const { data: claims } = await admin
          .from('zip_claims')
          .select('claim_type')
          .eq('zip', zip)
          .eq('niche', niche)
          .eq('is_active', true)

        const proCount = (claims ?? []).filter(c => c.claim_type === 'available' || c.claim_type === 'available_with_warning').length
        const eliteCount = (claims ?? []).filter(c => c.claim_type === 'exclusive' || c.claim_type === 'exclusive_locked').length
        const elitePlusCount = (claims ?? []).filter(c => c.claim_type === 'super_exclusive' || c.claim_type === 'super_exclusive_locked').length

        // Count leads in last 30 days
        const { count: leadCount } = await admin
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('zip_code', zip)
          .eq('niche', niche)
          .gte('created_at', monthAgo)

        const isOversaturated = proCount > 3 || eliteCount > 2 || elitePlusCount > 1

        // Upsert capacity record
        await admin.from('zip_capacity').upsert({
          zip_code: zip,
          niche,
          max_pro_count: 3,
          current_pro_count: proCount,
          max_elite_count: 2,
          current_elite_count: eliteCount,
          max_elite_plus_count: 1,
          current_elite_plus_count: elitePlusCount,
          is_oversaturated: isOversaturated,
          leads_last_30_days: leadCount ?? 0,
        }, { onConflict: 'zip,niche' })

        updated++
      } catch (err) {
        await logError('zip_capacity_cron_error', `ZIP-Niche ${pair}: ${String(err)}`)
      }
    }

    return Response.json({
      success: true,
      zips_updated: updated,
      message: `ZIP capacity monitored for ${updated} ZIP-niche pairs`,
    })
  } catch (err) {
    await logError('zip_capacity_cron_fatal', String(err))
    return structuredError('Cron job failed', 500)
  }
}
