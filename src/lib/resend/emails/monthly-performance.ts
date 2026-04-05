// ============================================================
// Email 5 – Monthly Performance Summary
// Subject: Your TradeReach Report – [Month] [Year]
// ============================================================

import { htmlWrapper, emailHeader, emailBody, contractorFooter, ctaButton, statCard, BRAND } from './base'

export interface MonthlyPerformanceProps {
  firstName: string
  month: string // e.g. "March 2025"
  leadsReceived: number
  leadsClaimed: number
  responseRate: string // e.g. "73%"
  estimatedRevenue: string // e.g. "$12,400"
  dashboardUrl: string
}

export function renderMonthlyPerformance(props: MonthlyPerformanceProps): string {
  const { firstName, month, leadsReceived, leadsClaimed, responseRate, estimatedRevenue, dashboardUrl } = props

  const body = `
    <!-- Headline -->
    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};line-height:1.2;">Your Monthly Performance Report</h1>
    <p style="margin:0 0 32px;font-size:15px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">Hi ${firstName} — here is your TradeReach summary for <strong>${month}</strong>.</p>

    <!-- Stats Grid -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:10px;">
      <tr>
        ${statCard('Leads Received', String(leadsReceived))}
        ${statCard('Leads Claimed', String(leadsClaimed))}
      </tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
      <tr>
        ${statCard('Response Rate', responseRate)}
        ${statCard('Est. Revenue Generated', estimatedRevenue)}
      </tr>
    </table>

    <!-- Divider -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr><td style="border-top:1px solid ${BRAND.gray200};height:1px;line-height:1px;">&nbsp;</td></tr>
    </table>

    <!-- Motivational line -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
      <tr>
        <td style="background-color:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;padding:16px 20px;">
          <p style="margin:0;font-size:14px;color:#1e40af;font-family:${BRAND.fontStack};line-height:1.6;">
            <strong>Pro tip:</strong> Top contractors on TradeReach respond within 5 minutes.
            The faster you call, the more you close.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          ${ctaButton('View Your Dashboard →', dashboardUrl)}
        </td>
      </tr>
    </table>

    <!-- Fine print -->
    <p style="margin:0;font-size:12px;color:${BRAND.gray500};font-family:${BRAND.fontStack};text-align:center;">
      Revenue estimate is based on average job values for your service category and is not a guarantee of earnings.
    </p>
  `

  return htmlWrapper(`
    ${emailHeader('Monthly Report')}
    ${emailBody(body)}
    ${contractorFooter()}
  `)
}
