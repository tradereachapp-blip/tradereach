// ============================================================
// Email 3 – Trial Ending in 24 Hours
// Subject: Your Free Trial Ends Tomorrow – Don't Lose Your Leads
// ============================================================

import { htmlWrapper, emailHeader, emailBody, contractorFooter, ctaButton, BRAND } from './base'

export interface TrialEndingProps {
  firstName: string
  activateUrl: string
  proPriceMonthly: number
  elitePriceMonthly: number
}

export function renderTrialEnding(props: TrialEndingProps): string {
  const { firstName, activateUrl, proPriceMonthly, elitePriceMonthly } = props

  const body = `
    <!-- Warning Banner -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:14px 18px;text-align:center;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#991b1b;font-family:${BRAND.fontStack};">
            ⚠️ Your 7-day free trial ends tomorrow
          </p>
        </td>
      </tr>
    </table>

    <!-- Headline -->
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};line-height:1.2;">Your 7-day trial ends tomorrow.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.7;">
      Hi ${firstName}, you have been receiving lead notifications in your area.
      Tomorrow your trial ends and notifications will pause until you activate your plan.
    </p>

    <!-- Plan Options -->
    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:${BRAND.orange};text-transform:uppercase;letter-spacing:0.08em;font-family:${BRAND.fontStack};">Choose your plan</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr valign="top">
        <!-- Pro Plan -->
        <td style="width:50%;padding-right:8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="background-color:${BRAND.gray50};border:1px solid ${BRAND.gray200};border-radius:8px;padding:20px;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${BRAND.gray500};text-transform:uppercase;letter-spacing:0.06em;font-family:${BRAND.fontStack};">Pro</p>
                <p style="margin:0 0 12px;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};">$${proPriceMonthly}<span style="font-size:13px;font-weight:400;color:${BRAND.gray500};">/mo</span></p>
                <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gray700};font-family:${BRAND.fontStack};">✓ Up to 10 leads/month</p>
                <p style="margin:0 0 6px;font-size:13px;color:${BRAND.gray700};font-family:${BRAND.fontStack};">✓ SMS + email alerts</p>
                <p style="margin:0;font-size:13px;color:${BRAND.gray700};font-family:${BRAND.fontStack};">✓ 5 ZIP codes</p>
              </td>
            </tr>
          </table>
        </td>
        <!-- Elite Plan -->
        <td style="width:50%;padding-left:8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="background-color:${BRAND.navy};border:2px solid ${BRAND.orange};border-radius:8px;padding:20px;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${BRAND.orange};text-transform:uppercase;letter-spacing:0.06em;font-family:${BRAND.fontStack};">Elite ⭐</p>
                <p style="margin:0 0 12px;font-size:26px;font-weight:800;color:${BRAND.white};font-family:${BRAND.fontStack};">$${elitePriceMonthly}<span style="font-size:13px;font-weight:400;color:#94a3b8;">/mo</span></p>
                <p style="margin:0 0 6px;font-size:13px;color:#e2e8f0;font-family:${BRAND.fontStack};">✓ Unlimited leads</p>
                <p style="margin:0 0 6px;font-size:13px;color:#e2e8f0;font-family:${BRAND.fontStack};">✓ Priority 15-min window</p>
                <p style="margin:0;font-size:13px;color:#e2e8f0;font-family:${BRAND.fontStack};">✓ Unlimited ZIP codes</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr>
        <td align="center">
          ${ctaButton('Activate My Plan →', activateUrl)}
        </td>
      </tr>
    </table>

    <!-- Urgency -->
    <p style="margin:0;font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};text-align:center;line-height:1.6;">
      Leads in your area will continue flowing. Make sure you are there to claim them.
    </p>
  `

  return htmlWrapper(`
    ${emailHeader()}
    ${emailBody(body)}
    ${contractorFooter()}
  `)
}
