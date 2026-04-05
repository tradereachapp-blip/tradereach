import { Resend } from 'resend'
import { logError } from '@/lib/utils/error-logger'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@tradereachapp.com',
      to,
      subject,
      html,
    })
    return result
  } catch (err) {
    await logError('email_send_error', String(err))
    throw err
  }
}

export async function sendMonthlyCreditsGrantedEmail(email: string, contractor: any, creditAmount: number, newBalance: number, rolloverMax: number) {
  await sendEmail({
    to: email,
    subject: `${creditAmount} Free Credits Added to Your TradeReach Account`,
    html: `<h2>Monthly Credits Granted</h2><p>Your monthly grant of ${creditAmount} credits has been added. New balance: ${newBalance}/${rolloverMax}.</p>`,
  })
}

export async function sendLowCreditWarningEmail(email: string, contractor: any, creditsUsed: number, monthlyGrant: number) {
  await sendEmail({
    to: email,
    subject: `Warning: You've Used ${Math.round((creditsUsed / monthlyGrant) * 100)}% of Monthly Credits`,
    html: `<h2>Low Credit Alert</h2><p>You've used ${creditsUsed}/${monthlyGrant} credits. Overage charges will apply.</p>`,
  })
}

export async function sendUnusedCreditsNotification(email: string, contractor: any, creditsRemaining: number) {
  await sendEmail({
    to: email,
    subject: `You Have ${creditsRemaining} Unused Credits`,
    html: `<h2>Unused Credits</h2><p>You have ${creditsRemaining} unused credits this month. Claim leads now before they expire!</p>`,
  })
}

export async function sendCancellationEmail(email: string, contractor: any) {
  await sendEmail({
    to: email,
    subject: 'Your Subscription Has Been Cancelled',
    html: `<h2>Subscription Cancelled</h2><p>Your subscription will be cancelled at the end of your billing period.</p>`,
  })
}

export async function sendWinBackEmail(email: string, contractor: any, daysSinceCancellation: number) {
  const subject = daysSinceCancellation === 30 ? 'We Miss You!' : 'Last Chance: Come Back to TradeReach'
  await sendEmail({
    to: email,
    subject,
    html: `<h2>${subject}</h2><p>We'd love to have you back. ${daysSinceCancellation === 30 ? 'Leads in your area are waiting!' : 'Limited time offer for returning contractors.'}</p>`,
  })
}

export async function sendAccountManagerWelcomeEmail(email: string, contractor: any) {
  await sendEmail({
    to: email,
    subject: `New Elite Plus Contractor: ${contractor.company_name}`,
    html: `<h2>New Account Assignment</h2><p>Welcome ${contractor.company_name} as your new Elite Plus account to manage.</p>`,
  })
}

export async function sendAccountManagerReviewEmail(email: string, contractor: any, stats: any) {
  await sendEmail({
    to: email,
    subject: `Monthly Report: ${contractor.company_name}`,
    html: `<h2>Performance Report</h2><p>${contractor.company_name} claimed ${stats.claims_this_month} leads and used ${stats.credits_used} credits this month.</p>`,
  })
}

export async function sendUpgradeConfirmationEmail(email: string, contractor: any, newPlan: string, creditsAfterUpgrade: number) {
  await sendEmail({
    to: email,
    subject: `Upgrade Confirmed: Welcome to ${newPlan}!`,
    html: `<h2>Plan Upgrade Confirmed</h2><p>You've upgraded to ${newPlan}. Your credits have been adjusted to ${creditsAfterUpgrade}.</p>`,
  })
}

export async function sendZipTerritoryChangeNotification(email: string, contractor: any, zip: string, newStatus: string) {
  await sendEmail({
    to: email,
    subject: 'Your Territory Has Changed',
    html: `<h2>Territory Update</h2><p>Your status in ZIP ${zip} has changed. New status: ${newStatus}.</p>`,
  })
}

export async function sendLeadNotificationEmail(email: string, lead: any, tier: string, expireAt: Date) {
  const windowMinutes = tier === 'elite_plus' ? 30 : tier === 'elite' ? 15 : 5
  await sendEmail({
    to: email,
    subject: `New Lead: ${lead.niche} in ${lead.zip_code}`,
    html: `<h2>New Lead Available</h2><p>A new ${lead.niche} lead is available in ${lead.zip_code}. Claim within ${windowMinutes} minutes!</p>`,
  })
}

export async function sendLeadNotificationSMS(phone: string, lead: any, tier: string) {
  // Implemented in twilio.ts
}
