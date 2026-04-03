// ============================================================
// All Transactional Email Templates — TradeReach
// ============================================================

import { resend, FROM_EMAIL, ADMIN_EMAIL } from './client'
import { logError, safeErrorMessage } from '@/lib/utils/error-logger'
import type { Lead, Contractor } from '@/types'
import { createAdminClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tradereach.com'

// ----------------------------------------------------------------
// 1. Homeowner Confirmation
// ----------------------------------------------------------------
export async function sendHomeownerConfirmation(lead: Lead): Promise<void> {
  const firstName = lead.name.split(' ')[0]
  const supportPhone = process.env.SUPPORT_PHONE ?? ''

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: lead.phone, // This would be email if we collected it; phone is SMS
      subject: 'Your free quote request was received.',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #111827; padding: 24px 32px;">
              <p style="color: #9ca3af; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">
                Free Home Service Quotes
              </p>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px;">Hi ${firstName},</h2>
              <p style="color: #374151; line-height: 1.7; font-size: 15px; margin: 0 0 16px;">
                A licensed <strong>${lead.niche}</strong> contractor in your area will be in touch within
                <strong> 2 hours</strong>. They will call you from a local number.
                No obligation to hire.
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 40%;">Service</td>
                    <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${lead.niche}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">ZIP Code</td>
                    <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${lead.zip}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Best time to call</td>
                    <td style="padding: 6px 0; color: #111827; font-size: 13px; font-weight: 600;">${lead.callback_time ?? 'Anytime'}</td>
                  </tr>
                </table>
              </div>
              ${supportPhone ? `<p style="color: #6b7280; font-size: 14px;">If you have questions, call or text <a href="tel:${supportPhone}" style="color: #f97316;">${supportPhone}</a>.</p>` : '<p style="color: #6b7280; font-size: 14px;">If you have questions, reply to this email.</p>'}
            </div>
            <div style="background: #f9fafb; padding: 14px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                Powered by TradeReach &nbsp;·&nbsp; No spam. No obligation.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    await logError('email_homeowner_confirmation', safeErrorMessage(err), { lead_id: lead.id })
  }
}

// ----------------------------------------------------------------
// 2. Contractor Welcome Email
// ----------------------------------------------------------------
export async function sendContractorWelcome(
  email: string,
  contractor: Contractor
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to TradeReach — Your Account Is Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #1E3A5F; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to TradeReach</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1E3A5F;">Hi ${contractor.contact_name}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Your <strong>TradeReach</strong> account is set up and ready to go. 
                You're now set to receive ${contractor.niche} leads in your area.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${APP_URL}/dashboard" 
                   style="background: #F97316; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Go to Your Dashboard
                </a>
              </div>
              <p style="color: #4b5563; font-size: 14px;">
                <strong>How it works:</strong><br/>
                1. When a homeowner in your area requests a ${contractor.niche} quote, you'll get an SMS and email instantly.<br/>
                2. Log in to your dashboard and claim the lead before another contractor does.<br/>
                3. Call the homeowner and close the job.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    await logError('email_contractor_welcome', safeErrorMessage(err), { contractor_id: contractor.id })
  }
}

// ----------------------------------------------------------------
// 3. Trial Ending in 24 Hours
// ----------------------------------------------------------------
export async function sendTrialEndingEmail(
  email: string,
  contractor: Contractor
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '⚠️ Your TradeReach Trial Ends Tomorrow',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #dc2626; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">Trial Ending Tomorrow</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #4b5563; line-height: 1.6;">
                Hi ${contractor.contact_name}, your <strong>TradeReach free trial ends tomorrow</strong>. 
                Make sure your payment method is up to date to continue receiving leads without interruption.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${APP_URL}/settings" 
                   style="background: #F97316; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Update Billing
                </a>
              </div>
              <p style="color: #6b7280; font-size: 13px;">
                If you have any questions, just reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    await logError('email_trial_ending', safeErrorMessage(err), { contractor_id: contractor.id })
  }
}

// ----------------------------------------------------------------
// 4. Payment Failed
// ----------------------------------------------------------------
export async function sendPaymentFailedEmail(
  email: string,
  contractor: Contractor
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🚨 TradeReach Payment Failed — Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #dc2626; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">Payment Failed</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #4b5563; line-height: 1.6;">
                Hi ${contractor.contact_name}, we were unable to process your TradeReach payment. 
                <strong>Update your billing information</strong> to keep receiving leads.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${APP_URL}/settings" 
                   style="background: #dc2626; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Fix Payment Now
                </a>
              </div>
              <p style="color: #6b7280; font-size: 13px;">
                Your account will be suspended if payment is not resolved within 7 days.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    await logError('email_payment_failed', safeErrorMessage(err), { contractor_id: contractor.id })
  }
}

// ----------------------------------------------------------------
// 5. Contractor Lead Notification
// ----------------------------------------------------------------
export async function sendLeadNotificationEmail(
  email: string,
  contractor: Contractor,
  lead: Lead
): Promise<void> {
  const firstName = lead.name.split(' ')[0]
  const claimUrl = `${APP_URL}/dashboard`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🔔 New Lead in ${lead.zip} — ${lead.niche} Request`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #1E3A5F; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">New ${lead.niche} Lead</h1>
              <p style="color: #F97316; margin: 4px 0 0; font-size: 18px; font-weight: bold;">
                ZIP: ${lead.zip}
              </p>
            </div>
            <div style="padding: 32px;">
              <div style="background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #854d0e; font-weight: bold;">⚡ Act fast — leads are claimed first-come, first-served</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">First Name</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold;">${firstName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">ZIP Code</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold;">${lead.zip}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold;">${lead.niche}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #6b7280;">Best Time to Call</td>
                  <td style="padding: 10px; color: #111827; font-weight: bold;">${lead.callback_time ?? 'Anytime'}</td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 24px;">
                📞 Full contact info is revealed <strong>only after you claim the lead</strong> in your dashboard.
              </p>
              <div style="text-align: center;">
                <a href="${claimUrl}" 
                   style="background: #F97316; color: white; padding: 16px 36px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  View & Claim This Lead
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return
  } catch (err) {
    throw err // Let caller handle logging
  }
}

// ----------------------------------------------------------------
// 6. Cancellation Confirmation
// ----------------------------------------------------------------
export async function sendCancellationEmail(
  email: string,
  contractor: Contractor
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your TradeReach Subscription Has Been Canceled',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: #374151; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">Subscription Canceled</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #4b5563; line-height: 1.6;">
                Hi ${contractor.contact_name}, your TradeReach subscription has been canceled. 
                You'll retain access until the end of your current billing period.
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                You can reactivate your subscription anytime from your account settings.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${APP_URL}/settings" 
                   style="background: #1E3A5F; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Reactivate Subscription
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    await logError('email_cancellation', safeErrorMessage(err), { contractor_id: contractor.id })
  }
}

// ----------------------------------------------------------------
// 7. Admin New Lead Alert
// ----------------------------------------------------------------
export async function sendAdminLeadAlert(
  lead: Lead,
  matchingContractorCount: number
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[TradeReach] New ${lead.niche} Lead in ${lead.zip}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Lead Submitted</h2>
          <table>
            <tr><td><strong>Name:</strong></td><td>${lead.name}</td></tr>
            <tr><td><strong>ZIP:</strong></td><td>${lead.zip}</td></tr>
            <tr><td><strong>Niche:</strong></td><td>${lead.niche}</td></tr>
            <tr><td><strong>Callback:</strong></td><td>${lead.callback_time ?? 'Anytime'}</td></tr>
            <tr><td><strong>Matched Contractors:</strong></td><td>${matchingContractorCount}</td></tr>
            <tr><td><strong>Lead ID:</strong></td><td>${lead.id}</td></tr>
          </table>
          ${matchingContractorCount === 0 ? '<p style="color: red;"><strong>⚠️ COVERAGE GAP: No contractors matched this lead!</strong></p>' : ''}
          <p><a href="${APP_URL}/admin?admin_key=${process.env.ADMIN_PASSWORD}">View in Admin Panel</a></p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[admin-lead-alert] Failed to send:', err)
  }
}

// ----------------------------------------------------------------
// Admin Cron Summary
// ----------------------------------------------------------------
export async function sendAdminCronSummary(
  expiredCount: number,
  coverageGaps: Array<{ zip: string; niche: string; lead_id: string }>
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[TradeReach] Daily Lead Summary — ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Daily TradeReach Summary</h2>
          <p><strong>Leads expired (72h+):</strong> ${expiredCount}</p>
          <h3>Coverage Gaps Today</h3>
          ${coverageGaps.length === 0
            ? '<p>No coverage gaps today.</p>'
            : `<table border="1" cellpadding="8">
                <tr><th>ZIP</th><th>Niche</th><th>Lead ID</th></tr>
                ${coverageGaps.map(g => `<tr><td>${g.zip}</td><td>${g.niche}</td><td>${g.lead_id}</td></tr>`).join('')}
              </table>`
          }
        </div>
      `,
    })
  } catch (err) {
    console.error('[cron-summary] Failed to send:', err)
  }
}
