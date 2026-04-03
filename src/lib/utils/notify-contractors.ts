// ============================================================
// Lead Notification System
// Matches contractors, respects Elite priority window,
// sends email + SMS, logs every attempt
// ============================================================

import { findMatchingContractors, splitByPriority } from './zip-matching'
import { sendLeadNotificationEmail, sendAdminLeadAlert } from '@/lib/resend/templates'
import { sendLeadAlertSMS } from '@/lib/twilio/sms'
import { createAdminClient } from '@/lib/supabase/server'
import { logError, safeErrorMessage } from './error-logger'
import { ELITE_PRIORITY_WINDOW_MINUTES } from '@/lib/config'
import type { Lead, Contractor } from '@/types'

interface NotifyResult {
  notified: number
  eliteCount: number
  otherCount: number
}

async function getContractorEmail(contractorId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contractors')
    .select('user_id')
    .eq('id', contractorId)
    .single()

  if (!data) return null

  const { data: userData } = await supabase.auth.admin.getUserById(data.user_id)
  return userData?.user?.email ?? null
}

async function notifyContractor(
  contractor: Contractor,
  lead: Lead
): Promise<void> {
  const supabase = createAdminClient()
  const email = await getContractorEmail(contractor.id)

  // Email notification
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

  // SMS notification
  if (contractor.sms_notifications !== false && contractor.phone) {
    await sendLeadAlertSMS(contractor, lead)
  }
}

export async function notifyMatchingContractors(lead: Lead): Promise<NotifyResult> {
  try {
    const contractors = await findMatchingContractors(lead.niche, lead.zip)
    const { elite, others } = splitByPriority(contractors)

    // Notify Elite contractors first (priority window)
    for (const contractor of elite) {
      await notifyContractor(contractor, lead)
    }

    // If there are Elite contractors, schedule others to be notified after priority window
    // In Vercel Edge, we fire the "others" notification after the window
    if (elite.length > 0 && others.length > 0) {
      // Schedule non-elite notifications after priority window
      // We do this via a background API call with a delay marker
      const delayMs = ELITE_PRIORITY_WINDOW_MINUTES * 60 * 1000

      // Fire-and-forget with setTimeout equivalent in Next.js API context
      // We use a separate endpoint to handle the delayed notification
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      
      // We store the pending notification in DB and the cron/poll picks it up
      // For immediate production: use Vercel's edge scheduling
      // Here we mark it for deferred processing
      const supabase = createAdminClient()
      await supabase.from('errors').insert({
        type: 'info_deferred_notification',
        message: `Elite priority window active for lead ${lead.id}`,
        context: {
          lead_id: lead.id,
          notify_at: new Date(Date.now() + delayMs).toISOString(),
          contractor_ids: others.map(c => c.id),
        },
      })
    } else {
      // No Elite contractors — notify everyone immediately
      for (const contractor of others) {
        await notifyContractor(contractor, lead)
      }
    }

    // Coverage gap alert
    if (contractors.length === 0) {
      await logError('coverage_gap', `No contractors matched lead ${lead.id}`, {
        lead_id: lead.id,
        niche: lead.niche,
        zip: lead.zip,
      })
    }

    // Send admin alert
    await sendAdminLeadAlert(lead, contractors.length)

    return {
      notified: contractors.length,
      eliteCount: elite.length,
      otherCount: others.length,
    }
  } catch (err) {
    await logError('notify_contractors_failed', safeErrorMessage(err), {
      lead_id: lead.id,
    })
    return { notified: 0, eliteCount: 0, otherCount: 0 }
  }
}

// Process deferred (post-priority-window) notifications
export async function processDeferredNotifications(): Promise<void> {
  const supabase = createAdminClient()

  const { data: pending } = await supabase
    .from('errors')
    .select('*')
    .eq('type', 'info_deferred_notification')
    .lt('context->>notify_at', new Date().toISOString())

  if (!pending || pending.length === 0) return

  for (const record of pending) {
    const ctx = record.context as {
      lead_id: string
      notify_at: string
      contractor_ids: string[]
    }

    // Get the lead
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', ctx.lead_id)
      .single()

    if (!lead || lead.status !== 'available') {
      // Lead already claimed or gone — skip
      await supabase.from('errors').delete().eq('id', record.id)
      continue
    }

    // Get the contractors
    const { data: contractors } = await supabase
      .from('contractors')
      .select('*')
      .in('id', ctx.contractor_ids)

    if (contractors) {
      for (const contractor of contractors) {
        await notifyContractor(contractor, lead)
      }
    }

    // Remove the deferred record
    await supabase.from('errors').delete().eq('id', record.id)
  }
}
