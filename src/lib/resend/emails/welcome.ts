// ============================================================
// Email 2 — Contractor Welcome
// Subject: Welcome to TradeReach — You're Almost Live
// ============================================================

import { htmlWrapper, emailHeader, emailBody, contractorFooter, ctaButton, checklistItem, BRAND } from './base'

export interface WelcomeProps {
  firstName: string
  setupUrl: string
  niche?: string
}

export function renderWelcome(props: WelcomeProps): string {
  const { firstName, setupUrl, niche } = props

  const body = `
    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};line-height:1.2;">Welcome to TradeReach, ${firstName}.</h1>
    <p style="margin:0 0 32px;font-size:16px;color:${BRAND.gray500};font-family:${BRAND.fontStack};line-height:1.6;">You are minutes away from receiving warm ${niche ? niche.toLowerCase() + ' ' : ''}leads in your area.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;"><tr><td style="border-top:1px solid ${BRAND.gray200};height:1px;line-height:1px;">&nbsp;</td></tr></table>
    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${BRAND.orange};text-transform:uppercase;letter-spacing:0.08em;font-family:${BRAND.fontStack};">Three steps to go live</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
      ${checklistItem('Complete your profile — add your business name and contact details')}
      ${checklistItem('Add your service ZIP codes — set the coverage area where you want leads')}
      ${checklistItem('Choose your plan — activate Pro or Elite to start receiving lead alerts')}
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;"><tr><td align="center">${ctaButton('Complete Setup &rarr;', setupUrl)}</td></tr></table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;"><tr><td style="border-top:1px solid ${BRAND.gray200};height:1px;line-height:1px;">&nbsp;</td></tr></table>
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.navy};text-transform:uppercase;letter-spacing:0.06em;font-family:${BRAND.fontStack};">How it works</p>
    <p style="margin:0 0 10px;font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.7;">When a homeowner in your area requests a quote, you get an instant SMS and email alert. Log in and claim the lead. Call within 5 minutes — that's when the close rate is highest.</p>
    <p style="margin:0;font-size:13px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">Questions? <a href="mailto:support@tradereachapp.com" style="color:${BRAND.orange};text-decoration:none;">support@tradereachapp.com</a></p>
  `
  return htmlWrapper(`${emailHeader()}${emailBody(body)}${contractorFooter()}`)
}
