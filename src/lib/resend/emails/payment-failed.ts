// ============================================================
// Email 4 â Payment Failed
// Subject: Action Required â Update Your Billing to Keep Receiving Leads
// ============================================================

import { htmlWrapper, emailHeader, emailBody, contractorFooter, ctaButton, BRAND } from './base'

export interface PaymentFailedProps {
  firstName: string
  billingUrl: string
}

export function renderPaymentFailed(props: PaymentFailedProps): string {
  const { firstName, billingUrl } = props

  const body = `
    <!-- Alert Banner -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#fef2f2;border:1px solid #fecaca;border-left:4px solid ${BRAND.red};border-radius:6px;padding:16px 20px;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#991b1b;font-family:${BRAND.fontStack};">
            &#10060; &nbsp;Action Required: Payment not processed
          </p>
        </td>
      </tr>
    </table>

    <!-- Headline -->
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};line-height:1.2;">Your payment didn&rsquo;t go through.</h1>
    <p style="margin:0 0 12px;font-size:15px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.7;">
      Hi ${firstName}, we were unable to process your subscription payment.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.7;">
      <strong>Your lead notifications have been paused.</strong> Update your billing information to resume receiving leads immediately.
    </p>

    <!-- What's affected -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.gray50};border:1px solid ${BRAND.gray200};border-radius:8px;padding:0;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.gray900};text-transform:uppercase;letter-spacing:0.06em;font-family:${BRAND.fontStack};">What is paused</p>
          <p style="margin:0 0 8px;font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};">&#8212; &nbsp;SMS lead alerts</p>
          <p style="margin:0 0 8px;font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};">&#8212; &nbsp;Email lead notifications</p>
          <p style="margin:0;font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};">&#8212; &nbsp;Access to new leads in your dashboard</p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          ${ctaButton('Update Billing &rarr;', billingUrl)}
        </td>
      </tr>
    </table>

    <!-- Support note -->
    <p style="margin:0;font-size:13px;color:${BRAND.gray500};font-family:${BRAND.fontStack};text-align:center;">
      If you believe this is an error, contact <a href="mailto:support@tradereachapp.com" style="color:${BRAND.orange};text-decoration:none;">support@tradereachapp.com</a>
    </p>
  `

  return htmlWrapper(`
    ${emailHeader()}
    ${emailBody(body)}
    ${contractorFooter()}
  `)
}
