// ============================================================
// Email 1 — Lead Notification to Contractor
// Subject: New [Niche] Lead in [ZIP] — Claim Now
// ============================================================

import { htmlWrapper, emailHeader, emailBody, contractorFooter, ctaButton, detailRow, BRAND } from './base'

export interface LeadNotificationProps {
  contractorName: string
  serviceType: string
  zip: string
  homeownerFirstName: string
  callbackPreference: string
  claimUrl: string
  isElite?: boolean
}

export function renderLeadNotification(props: LeadNotificationProps): string {
  const { contractorName, serviceType, zip, homeownerFirstName, callbackPreference, claimUrl, isElite } = props

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};line-height:1.2;">New Lead in Your Area</h1>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">Hi ${contractorName} &mdash; a homeowner in your service area just requested a quote.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.gray50};border:1px solid ${BRAND.gray200};border-radius:8px;margin-bottom:28px;">
      <tr><td style="padding:4px 0;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${detailRow('Service Type', serviceType)}
        ${detailRow('ZIP Code', zip)}
        ${detailRow('Homeowner', homeownerFirstName)}
        ${detailRow('Callback Preference', callbackPreference)}
        ${detailRow('Phone Number', '<span style="color:#9ca3af;font-style:italic;font-weight:400;">Revealed after claiming</span>', true)}
      </table></td></tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
      <tr><td align="center">${ctaButton('Claim This Lead &rarr;', claimUrl)}</td></tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr><td align="center" style="padding:14px 20px;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:6px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#c2410c;font-family:${BRAND.fontStack};">&#9889; Leads are claimed on a first come, first served basis. Act fast.</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:${BRAND.gray500};font-family:${BRAND.fontStack};line-height:1.6;">Once you claim this lead, the homeowner&rsquo;s full contact information will be revealed in your dashboard. Call within 5 minutes for the best close rate.</p>
  `
  return htmlWrapper(`${emailHeader('New Lead Alert')}${emailBody(body)}${contractorFooter()}`)
}