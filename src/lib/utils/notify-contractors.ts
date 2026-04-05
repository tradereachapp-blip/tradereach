import { createAdminClient } from '@/lib/supabase/server'
import { sendLeadNotificationEmail, sendLeadNotificationSMS } from '@/lib/resend/templates'
import { sendSMS } from '@/lib/twilio'
import { logError } from './error-logger'

// 4-tier lead routing system
// Tier 1: All Elite Plus contractors (30-min window)
// Tier 2: All Elite contractors (15-min window)  
// Tier 3: Longest-waiting Pro (5-min head start)
// Tier 4: All remaining Pro + all PPL (simultaneous)

export async function notifyContractors(lead: any) {
  try {
    const admin = createAdminClient()
    const leadId = lead.id
    const zip = lead.zip_code
    const niche = lead.niche
    const now = new Date()

    // Get all contractors with this ZIP
    const { data: zipClaims } = await admin
      .from('zip_claims')
      .select('contractor_id, claim_type')
      .eq('zip', zip)
      .eq('niche', niche)
      .eq('is_active', true)

    if (!zipClaims || zipClaims.length === 0) {
      return
    }

    // Group by plan type
    const elitePlusContractors = (zipClaims ?? []).filter(c => c.claim_type === 'super_exclusive' || c.claim_type === 'super_exclusive_locked').map(c => c.contractor_id)
    const eliteContractors = (zipClaims ?? []).filter(c => c.claim_type === 'exclusive' || c.claim_type === 'exclusive_locked').map(c => c.contractor_id)
    const proContractors = (zipClaims ?? []).filter(c => c.claim_type === 'available' || c.claim_type === 'available_with_warning').map(c => c.contractor_id)

    // Tier 1: Elite Plus (30 min)
    if (elitePlusContractors.length > 0) {
      const expireAt = new Date(now.getTime() + 30 * 60 * 1000)
      await notifyTier(admin, elitePlusContractors, lead, 'elite_plus', expireAt)
      return // Don't proceed to lower tiers if Elite Plus exists
    }

    // Tier 2: Elite (15 min)
    if (eliteContractors.length > 0) {
      const expireAt = new Date(now.getTime() + 15 * 60 * 1000)
      await notifyTier(admin, eliteContractors, lead, 'elite', expireAt)
      return
    }

    // Tier 3: Longest-waiting Pro (5-min head start)
    if (proContractors.length > 0) {
      const { data: claims } = await admin
        .from('lead_claims')
        .select('contractor_id, claimed_at')
        .eq('niche', niche)
        .in('contractor_id', proContractors)
        .order('claimed_at', { ascending: true })
        .limit(1)

      const longestWaitingPro = claims?.[0]?.contractor_id || proContractors[0]

      // Notify longest-waiting Pro
      const headStartExpire = new Date(now.getTime() + 5 * 60 * 1000)
      await notifyTier(admin, [longestWaitingPro], lead, 'pro', headStartExpire)

      // After 5 minutes, notify all other Pros + PPL
      // (This would be handled by a separate queue/cron)
      setTimeout(async () => {
        const otherPros = proContractors.filter(c => c !== longestWaitingPro)
        if (otherPros.length > 0) {
          const finalExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h total
          await notifyTier(admin, otherPros, lead, 'pro', finalExpire)
        }
      }, 5 * 60 * 1000)

      return
    }
  } catch (err) {
    await logError('notify_contractors_error', String(err))
  }
}

async function notifyTier(
  admin: ReturnType<typeof createAdminClient>,
  contractorIds: string[],
  lead: any,
  tier: 'elite_plus' | 'elite' | 'pro',
  expireAt: Date
) {
  for (const contractorId of contractorIds) {
    try {
      const { data: contractor } = await admin
        .from('contractors')
        .select('user_id, phone_number, notification_preferences')
        .eq('id', contractorId)
        .single()

      if (!contractor) continue

      const { data: userData } = await admin.auth.admin.getUserById(contractor.user_id)
      const email = userData?.user?.email

      // Email notification
      if (email) {
        await sendLeadNotificationEmail(email, lead, tier, expireAt)
      }

      // SMS notification if enabled
      const notifPrefs = contractor.notification_preferences ?? {}
      if (notifPrefs.sms_enabled && contractor.phone_number) {
        const windowMinutes = tier === 'elite_plus' ? 30 : tier === 'elite' ? 15 : 5
        await sendSMS(
          contractor.phone_number,
          `TradeReach: New ${lead.niche} lead in ${lead.zip_code}. Claim within ${windowMinutes} min: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        )
      }
    } catch (err) {
      await logError(`notify_tier_${tier}_error`, `Contractor ${contractorId}: ${String(err)}`)
    }
  }
}
