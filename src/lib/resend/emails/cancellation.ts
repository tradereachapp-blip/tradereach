// ============================================================
// Email 7 – Cancellation Confirmation
// Subject: Your TradeReach Subscription Has Been Cancelled
// ============================================================

import { htmlWrapper, emailHeader, emailBody, contractorFooter, ctaButton, BRAND } from './base'

export interface CancellationProps {
  firstName: string
  accessEndsDate: string // e.g. "April 30, 2025"
  reactivateUrl: string
}

export function renderCancellation(props: CancellationProps): string {
  const { firstName, accessEndsDate, reactivateUrl } = props

  const body = `
    <!-- Headline -->
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};line-height:1.2;">Sorry to see you go.</h1>
    <p style="margin:0 0 12px;font-size:15px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.7;">
      Hi ${firstName}, your subscription has been cancelled.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.7;">
      You will retain full access to your account and leads until <strong>${accessEndsDate}</strong>.
      After that, lead notifications and dashboard access will be paused.
    </p>

    <!-- Divider -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr><td style="border-top:1px solid ${BRAND.gray200};height:1px;line-height:1px;">&nbsp;</td></tr>
    </table>

    <!-- Win-back block -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${BRAND.orange};text-transform:uppercase;letter-spacing:0.06em;font-family:${BRAND.fontStack};">Changed your mind?</p>
          <p style="margin:0 0 16px;font-size:15px;color:${BRAND.gray900};font-family:${BRAND.fontStack};line-height:1.7;">
            Reactivate anytime and pick up right where you left off. Your account settings, ZIP codes, and lead history are all saved.
          </p>

          <!-- Promo code -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
            <tr>
              <td style="background-color:${BRAND.white};border:2px dashed ${BRAND.orange};border-radius:6px;padding:12px 20px;text-align:center;">
                <p style="margin:0 0 2px;font-size:11px;color:${BRAND.gray500};text-transform:uppercase;letter-spacing:0.08em;font-family:${BRAND.fontStack};">Returning member offer</p>
                <p style="margin:0;font-size:22px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};letter-spacing:0.05em;">RETURN20</p>
                <p style="margin:4px 0 0;font-size:12px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">20% off your first month back</p>
              </td>
            </tr>
          </table>

          ${ctaButton('Reactivate My Account →', reactivateUrl)}
        </td>
      </tr>
    </table>

    <!-- Support -->
    <p style="margin:0;font-size:13px;color:${BRAND.gray500};font-family:${BRAND.fontStack};line-height:1.6;">
      If there is anything we could have done better, we would genuinely like to know.
      Reply to this email or reach us at <a href="mailto:support@tradereachapp.com" style="color:${BRAND.orange};text-decoration:none;">support@tradereachapp.com</a>
    </p>
  `

  return htmlWrapper(`
    ${emailHeader()}
    ${emailBody(body)}
    ${contractorFooter()}
  `)
}
