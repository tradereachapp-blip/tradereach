// ============================================================
// TradeReach™ — 4-Tier Lead Notification System
//
// TIER 1 — Elite Plus: 30-min exclusive window
// TIER 2 — Elite: 15-min priority window (after Elite Plus)
// TIER 3 — Pro: Weighted round-robin, 5-min head start to longest-waiting Pro
// TIER 4 — PPL: Notified simultaneously with Pro
//
// At each tier, multiple contractors of that tier may receive leads
// simultaneously (e.g., multiple Elite contractors in same ZIP).
// ============================================================

import { createAdminClient } from '@/lib/supabase/server'
import { sendLeadNotificationEmail, sendAdminLeadAlert } from '@/lib/resend/templates'
import { sendLeadAlertSMS } from '@/lib/twilio/sms'
import { logError, safeErrorMessage } from './error-logger'
import { PRICING } from '@/lib/pricing'
import type { Lead, Contractor, Niche } from '@/types'

const ELITE_PLUS_WINDOW_MS = PRICING.ELITE_PLUS_PRIORITY_WINDOW_MINUTES * 60 * 1000  // 30 min
const ELITE_WINDOW_MS = PRICING.ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000              // 15 min
const PRO_HEAD_START_MS = 5 * 60 * 1000                                                // 5 min head start

/** Lead notification tier windows stored in lead.notification_queue as JSON */
interface NotificationState {
  tier: 'elite_plus' | 'elite' | 'pro_ppl' | 'done'
  elitePlusNotifiedAt: string | null
  eliteNotifiedAt: string | null
  proNotifiedAt: string | null
  roundRobinIndex: number
}

async function getContractorsForZipNiche(niche: Niche, zip: string): Promise<{
  elitePlus: Contractor[]
  elite: Contractor[]
  pro: Contractor[]
  ppl: Contractor[]
}> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('contractors')
    .select('*')
    .eq('niche', niche)
    .contains('zip_codes', [zip])

  const contractors = (data ?? []).filter((c) => {
    if (c.plan_type === 'pay_per_lead') return true
    if (c.plan_type === 'none') return false
    // Skip paused contractors
    if (c.pause_subscription_until) {
      const pauseEnd = new Date(c.pause_subscription_until)
      if (pauseEnd > new Date()) return false
    }
    return ['active', 'trialing'].includes(c.subscription_status)
  })

  return {
    elitePlus: contractors.filter(c => c.plan_type === 'elite_plus'),
    elite: contractors.filter(c => c.plan_type === 'elite'),
    pro: contractors.filter(c => c.plan_type === 'pro'),
    ppl: contractors.filter(c => c.plan_type === 'pay_per_lead'),
  }
}

async function getContractorEmail(contractor: Contractor): Promise<string | null> {
  if (contractor.notification_email?.trim()) return contractor.notification_email.trim()
  const admin = createAdminClient()
  const { data } = await admin.auth.admin.getUserById(contractor.user_id)
  return data?.user?.email ?? null
}

async function notifyContractor(contractor: Contractor, lead: Lead, windowType: string): Promise<void> {
  const admin = createAdminClient()
  const email = await getContractorEmail(contractor)

  if (contractor.email_notifications !== false && email) {
    try {
      await sendLeadNotificationEmail(email, contractor, lead)
      await admin.from('notifications').insert({
        contractor_id: contractor.id,
        lead_id: lead.id,
        type: 'email',
        status: 'sent',
        error_message: `window_type:${windowType}`,
      })
    } catch (err) {
      const msg = safeErrorMessage(err)
      await admin.from('notifications').insert({
        contractor_id: contractor.id,
        lead_id: lead.id,
        type: 'email',
        status: 'failed',
        error_message: msg,
      })
    }
  }

  if (contractor.sms_notifications !== false && (contractor.sms_notification_phone || contractor.phone)) {
    try {
      await sendLeadAlertSMS(contractor, lead)
      await admin.from('notifications').insert({
        contractor_id: contractor.id,
        lead_id: lead.id,
        type: 'sms',
        status: 'sent',
        error_message: `window_type:${windowType}`,
      })
    } catch (err) {
      // Log but don't fail
    }
  }
}

/**
 * Called immediately when a new lead arrives.
 * Determines which tier gets notified first based on who covers this ZIP.
 */
export async function notifyMatchingContractors(lead: Lead): Promise<{ notified: number; queueLength: number; contractorId: string | null }> {
  const admin = createAdminClient()

  try {
    const { elitePlus, elite, pro, ppl } = await getContractorsForZipNiche(lead.niche, lead.zip)
    const total = elitePlus.length + elite.length + pro.length + ppl.length

    if (total === 0) {
      await logError('coverage_gap', `No contractors matched lead ${lead.id}`, { lead_id: lead.id, niche: lead.niche, zip: lead.zip })
      await sendAdminLeadAlert(lead, 0)
      return { notified: 0, queueLength: 0, contractorId: null }
    }

    const now = new Date()
    let notified = 0
    let windowExpiry: Date
    let tierLabel: string

    if (elitePlus.length > 0) {
      // TIER 1: Elite Plus — notify all Elite Plus contractors simultaneously
      windowExpiry = new Date(now.getTime() + ELITE_PLUS_WINDOW_MS)
      tierLabel = 'elite_plus_window'

      const state: NotificationState = {
        tier: 'elite_plus',
        elitePlusNotifiedAt: now.toISOString(),
        eliteNotifiedAt: null,
        proNotifiedAt: null,
        roundRobinIndex: 0,
      }

      await admin.from('leads').update({
        active_notification_contractor_id: elitePlus[0].id,
        notification_window_expires_at: windowExpiry.toISOString(),
        notification_queue: JSON.stringify(state),
      }).eq('id', lead.id)

      for (const contractor of elitePlus) {
        await notifyContractor(contractor, lead, tierLabel)
        notified++
      }
    } else if (elite.length > 0) {
      // TIER 2: Elite — no Elite Plus, skip straight to Elite
      windowExpiry = new Date(now.getTime() + ELITE_WINDOW_MS)
      tierLabel = 'elite_window'

      const state: NotificationState = {
        tier: 'elite',
        elitePlusNotifiedAt: null,
        eliteNotifiedAt: now.toISOString(),
        proNotifiedAt: null,
        roundRobinIndex: 0,
      }

      await admin.from('leads').update({
        active_notification_contractor_id: elite[0].id,
        notification_window_expires_at: windowExpiry.toISOString(),
        notification_queue: JSON.stringify(state),
      }).eq('id', lead.id)

      for (const contractor of elite) {
        await notifyContractor(contractor, lead, tierLabel)
        notified++
      }
    } else {
      // TIER 3+4: No Elite at all — go straight to Pro + PPL
      // Sort Pro by longest time since last claimed lead (weighted round-robin)
      const sortedPro = await sortProByWaitTime(pro)
      const headStartPro = sortedPro.length > 0 ? sortedPro[0] : null

      windowExpiry = new Date(now.getTime() + PRO_HEAD_START_MS)
      tierLabel = 'pro_head_start'

      const state: NotificationState = {
        tier: 'pro_ppl',
        elitePlusNotifiedAt: null,
        eliteNotifiedAt: null,
        proNotifiedAt: now.toISOString(),
        roundRobinIndex: 0,
      }

      await admin.from('leads').update({
        active_notification_contractor_id: headStartPro?.id ?? ppl[0]?.id ?? null,
        notification_window_expires_at: windowExpiry.toISOString(),
        notification_queue: JSON.stringify(state),
      }).eq('id', lead.id)

      // Notify head-start Pro first
      if (headStartPro) {
        await notifyContractor(headStartPro, lead, 'pro_head_start')
        notified++
      } else {
        // No Pro — notify all PPL immediately
        for (const contractor of ppl) {
          await notifyContractor(contractor, lead, 'ppl')
          notified++
        }
        // Mark as fully open
        await admin.from('leads').update({
          active_notification_contractor_id: null,
          notification_window_expires_at: null,
          notification_queue: JSON.stringify({ tier: 'done', elitePlusNotifiedAt: null, eliteNotifiedAt: null, proNotifiedAt: now.toISOString(), roundRobinIndex: 0 }),
        }).eq('id', lead.id)
      }
    }

    await sendAdminLeadAlert(lead, total)

    return { notified, queueLength: total - notified, contractorId: elitePlus[0]?.id ?? elite[0]?.id ?? pro[0]?.id ?? null }
  } catch (err) {
    await logError('notify_contractors_failed', safeErrorMessage(err), { lead_id: lead.id })
    return { notified: 0, queueLength: 0, contractorId: null }
  }
}

/**
 * Sort Pro contractors by longest wait (for weighted round-robin).
 * Contractors who haven't claimed a lead recently get priority.
 */
async function sortProByWaitTime(proContractors: Contractor[]): Promise<Contractor[]> {
  if (proContractors.length <= 1) return proContractors

  const admin = createAdminClient()
  const waitTimes: Map<string, number> = new Map()

  for (const contractor of proContractors) {
    const { data: lastClaim } = await admin
      .from('lead_claims')
      .select('claimed_at')
      .eq('contractor_id', contractor.id)
      .order('claimed_at', { ascending: false })
      .limit(1)
      .single()

    const lastClaimTime = lastClaim?.claimed_at
      ? new Date(lastClaim.claimed_at).getTime()
      : 0  // Never claimed = longest wait

    waitTimes.set(contractor.id, lastClaimTime)
  }

  return [...proContractors].sort((a, b) => (waitTimes.get(a.id) ?? 0) - (waitTimes.get(b.id) ?? 0))
}

/**
 * Called by cron every 5 minutes.
 * Advances the notification window to the next tier when current window expires.
 */
export async function processExpiredNotificationWindows(): Promise<number> {
  const admin = createAdminClient()
  let processed = 0

  try {
    const { data: expiredLeads } = await admin
      .from('leads')
      .select('*')
      .eq('status', 'available')
      .not('notification_window_expires_at', 'is', null)
      .lt('notification_window_expires_at', new Date().toISOString())

    if (!expiredLeads || expiredLeads.length === 0) return 0

    for (const lead of expiredLeads) {
      try {
        let state: NotificationState | null = null
        try {
          state = typeof lead.notification_queue === 'string'
            ? JSON.parse(lead.notification_queue)
            : (Array.isArray(lead.notification_queue) ? null : lead.notification_queue)
        } catch { state = null }

        if (!state || state.tier === 'done') {
          await admin.from('leads').update({
            active_notification_contractor_id: null,
            notification_window_expires_at: null,
          }).eq('id', lead.id)
          continue
        }

        const { elitePlus, elite, pro, ppl } = await getContractorsForZipNiche(lead.niche, lead.zip)
        const now = new Date()

        if (state.tier === 'elite_plus') {
          // Move to Elite tier
          if (elite.length > 0) {
            const windowExpiry = new Date(now.getTime() + ELITE_WINDOW_MS)
            const newState: NotificationState = { ...state, tier: 'elite', eliteNotifiedAt: now.toISOString() }
            await admin.from('leads').update({
              active_notification_contractor_id: elite[0].id,
              notification_window_expires_at: windowExpiry.toISOString(),
              notification_queue: JSON.stringify(newState),
            }).eq('id', lead.id)
            for (const contractor of elite) {
              await notifyContractor(contractor as Contractor, lead as Lead, 'elite_window')
              processed++
            }
          } else {
            // Skip to Pro+PPL
            await advanceToProPPL(lead as Lead, pro as Contractor[], ppl as Contractor[], state, admin, now)
            processed++
          }
        } else if (state.tier === 'elite') {
          // Move to Pro+PPL
          await advanceToProPPL(lead as Lead, pro as Contractor[], ppl as Contractor[], state, admin, now)
          processed++
        } else if (state.tier === 'pro_ppl') {
          // Head start expired — now notify all Pro + PPL simultaneously
          const sortedPro = await sortProByWaitTime(pro as Contractor[])
          const newState: NotificationState = { ...state, tier: 'done' }
          await admin.from('leads').update({
            active_notification_contractor_id: null,
            notification_window_expires_at: null,
            notification_queue: JSON.stringify(newState),
          }).eq('id', lead.id)
          // Notify remaining Pro (skip the head-start one if they already got it)
          const alreadyNotifiedId = lead.active_notification_contractor_id
          for (const contractor of sortedPro) {
            if (contractor.id !== alreadyNotifiedId) {
              await notifyContractor(contractor, lead as Lead, 'pro_open')
              processed++
            }
          }
          for (const contractor of ppl as Contractor[]) {
            await notifyContractor(contractor, lead as Lead, 'ppl')
            processed++
          }
        }
      } catch (leadErr) {
        await logError('process_window_lead_error', safeErrorMessage(leadErr), { lead_id: lead.id })
      }
    }
  } catch (err) {
    await logError('process_expired_windows_failed', safeErrorMessage(err))
  }

  return processed
}

async function advanceToProPPL(
  lead: Lead,
  pro: Contractor[],
  ppl: Contractor[],
  state: NotificationState,
  admin: ReturnType<typeof createAdminClient>,
  now: Date
) {
  if (pro.length === 0 && ppl.length === 0) {
    await admin.from('leads').update({
      active_notification_contractor_id: null,
      notification_window_expires_at: null,
      notification_queue: JSON.stringify({ ...state, tier: 'done' }),
    }).eq('id', lead.id)
    return
  }

  const sortedPro = await sortProByWaitTime(pro)
  const headStartPro = sortedPro.length > 0 ? sortedPro[0] : null
  const windowExpiry = new Date(now.getTime() + PRO_HEAD_START_MS)
  const newState: NotificationState = { ...state, tier: 'pro_ppl', proNotifiedAt: now.toISOString() }

  if (headStartPro) {
    await admin.from('leads').update({
      active_notification_contractor_id: headStartPro.id,
      notification_window_expires_at: windowExpiry.toISOString(),
      notification_queue: JSON.stringify(newState),
    }).eq('id', lead.id)
    await notifyContractor(headStartPro, lead, 'pro_head_start')
  } else {
    // No Pro, just PPL
    await admin.from('leads').update({
      active_notification_contractor_id: null,
      notification_window_expires_at: null,
      notification_queue: JSON.stringify({ ...newState, tier: 'done' }),
    }).eq('id', lead.id)
    for (const contractor of ppl) {
      await notifyContractor(contractor, lead, 'ppl')
    }
  }
}
