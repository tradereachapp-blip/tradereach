// ============================================================
// Lead Notification System — Sequential Single-Contractor Model
//
// CORE RULE: Only ONE contractor is notified at a time.
// Contractors are worked through a prioritized queue.
// Once a lead is claimed, all notifications stop permanently.
// A homeowner will NEVER receive calls from more than one contractor.
// ============================================================

import { findMatchingContractors, splitByPriority } from './zip-matching'
import { sendLeadNotificationEmail, sendAdminLeadAlert } from '@/lib/resend/templates'
import { sendLeadAlertSMS } from '@/lib/twilio/sms'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage } from './error-logger'
import { ELITE_PRIORITY_WINDOW_MINUTES } from '@/lib/config'
import type { Lead, Contractor } from '@/types'

// How long each contractor has to claim before next in queue is notified (minutes)
const NOTIFICATION_WINDOW_MINUTES = ELITE_PRIORITY_WINDOW_MINUTES

interface NotifyResult {
  notified: number
  queueLength: number
  contractorId: string | null
}

/** Fetch contractor's notification email — uses notification_email if set, falls back to auth email */
async function getContractorEmail(contractor: Contractor): Promise<string | null> {
  // Use dedicated notification email if the contractor set one
  if (contractor.notification_email?.trim()) {
    return contractor.notification_email.trim()
  }
  // Fall back to their Supabase auth email
  const supabase = createAdminClient()
  const { data } = await supabase.auth.admin.getUserById(contractor.user_id)
  return data?.user?.email ?? null
}

/** Send email + SMS to a single contractor about a lead */
async function notifyOneContractor(contractor: Contractor, lead: Lead): Promise<void> {
  const supabase = createAdminClient()
  const email = await getContractorEmail(contractor)

  // Email
  if (contractor.email_notifications !== false && email) {
    try {
      await sendLeadNotificationEmail(email, contractor, lead)
      await supabase.from('notifications').insert({
        contractor_id: contractor.id,
        lead_id: lead.id,
        type: 'email',
        status: 'sent',
      })
    } catch (err) {
      const message = safeErrorMessage(err)
      await supabase.from('notifications').insert({
        contractor_id: contractor.id,
        lead_id: lead.id,
        type: 'email',
        status: 'failed',
        error_message: message,
      })
      await logError('email_notification_failed', message, {
        contractor_id: contractor.id,
        lead_id: lead.id,
      })
    }
  }

  // SMS
  if (contractor.sms_notifications !== false && contractor.phone) {
    await sendLeadAlertSMS(contractor, lead)
  }
}

/**
 * Called immediately when a new lead is submitted.
 * Builds the prioritized notification queue and notifies only the first contractor.
 */
export async function notifyMatchingContractors(lead: Lead): Promise<NotifyResult> {
  const supabase = createAdminClient()

  try {
    const contractors = await findMatchingContractors(lead.niche, lead.zip)

    // Coverage gap — no one to notify
    if (contractors.length === 0) {
      await logError('coverage_gap', `No contractors matched lead ${lead.id}`, {
        lead_id: lead.id,
        niche: lead.niche,
        zip: lead.zip,
      })
      await sendAdminLeadAlert(lead, 0)
      return { notified: 0, queueLength: 0, contractorId: null }
    }

    // Build ordered queue: Elite first, then others, within each group sort by created_at
    const { elite, others } = splitByPriority(contractors)
    const orderedQueue = [...elite, ...others]
    const [first, ...remaining] = orderedQueue

    // Set queue and active window on the lead
    const windowExpiresAt = new Date(Date.now() + NOTIFICATION_WINDOW_MINUTES * 60 * 1000)
    await supabase
      .from('leads')
      .update({
        active_notification_contractor_id: first.id,
        notification_window_expires_at: windowExpiresAt.toISOString(),
        notification_queue: remaining.map(c => c.id),
      })
      .eq('id', lead.id)

    // Notify only the first contractor
    await notifyOneContractor(first, lead)

    await sendAdminLeadAlert(lead, contractors.length)

    return {
      notified: 1,
      queueLength: remaining.length,
      contractorId: first.id,
    }
  } catch (err) {
    await logError('notify_contractors_failed', safeErrorMessage(err), { lead_id: lead.id })
    return { notified: 0, queueLength: 0, contractorId: null }
  }
}

/**
 * Called by the cron job every 15 minutes.
 * Finds leads whose active notification window has expired and the lead is still unclaimed.
 * Pops the next contractor from the queue and notifies them.
 */
export async function processExpiredNotificationWindows(): Promise<number> {
  const supabase = createAdminClient()
  let processed = 0

  try {
    // Find available leads whose current notification window has expired
    const { data: expiredLeads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'available')
      .not('notification_window_expires_at', 'is', null)
      .lt('notification_window_expires_at', new Date().toISOString())

    if (error || !expiredLeads || expiredLeads.length === 0) return 0

    for (const lead of expiredLeads) {
      const queue: string[] = lead.notification_queue ?? []

      if (queue.length === 0) {
        // Queue exhausted — clear window fields, lead stays available but no more notifications
        await supabase
          .from('leads')
          .update({
            active_notification_contractor_id: null,
            notification_window_expires_at: null,
            notification_queue: [],
          })
          .eq('id', lead.id)
        continue
      }

      // Pop next contractor from queue
      const [nextContractorId, ...remainingQueue] = queue
      const { data: contractor } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', nextContractorId)
        .single()

      if (!contractor) {
        // Contractor deleted or inactive — skip to next
        await supabase
          .from('leads')
          .update({ notification_queue: remainingQueue })
          .eq('id', lead.id)
        continue
      }

      // Advance the window
      const newExpiry = new Date(Date.now() + NOTIFICATION_WINDOW_MINUTES * 60 * 1000)
      await supabase
        .from('leads')
        .update({
          active_notification_contractor_id: nextContractorId,
          notification_window_expires_at: newExpiry.toISOString(),
          notification_queue: remainingQueue,
        })
        .eq('id', lead.id)

      // Notify them
      await notifyOneContractor(contractor, lead as Lead)
      processed++
    }
  } catch (err) {
    await logError('process_expired_windows_failed', safeErrorMessage(err))
  }

  return processed
}
