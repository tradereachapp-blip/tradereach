// ============================================================
// Email 6 – Homeowner Quote Confirmation
// Subject: Your Quote Request Was Received
// ============================================================

import { htmlWrapper, homeownerFooter, BRAND } from './base'

export interface HomeownerConfirmationProps {
  firstName: string
  serviceType: string
  zip: string
  callbackPreference: string
  supportPhone?: string
}

export function renderHomeownerConfirmation(props: HomeownerConfirmationProps): string {
  const { firstName, serviceType, zip, callbackPreference, supportPhone } = props

  // Homeowner email uses a lighter, softer header
  const header = `<tr>
    <td style="background-color:${BRAND.navy};border-radius:8px 8px 0 0;padding:24px 40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:${BRAND.fontStack};font-size:20px;font-weight:800;color:${BRAND.orange};">Trade</span><span style="font-family:${BRAND.fontStack};font-size:20px;font-weight:800;color:${BRAND.white};">Reach</span>
          </td>
          <td style="text-align:right;">
            <span style="font-size:12px;color:#94a3b8;font-family:${BRAND.fontStack};">Home Service Quotes</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`

  const body = `<tr>
    <td style="background-color:${BRAND.white};padding:40px;">

      <!-- Confirmation checkmark -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td align="center">
            <div style="width:56px;height:56px;border-radius:50%;background-color:#dcfce7;text-align:center;line-height:56px;display:inline-block;">
              <span style="font-size:26px;color:#16a34a;">✓</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Headline -->
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};text-align:center;line-height:1.3;">We received your request.</h1>
      <p style="margin:0 0 28px;font-size:15px;color:${BRAND.gray700};font-family:${BRAND.fontStack};text-align:center;line-height:1.7;">
        Hi ${firstName} — a trusted local contractor in your area will contact you within <strong>2 hours</strong> during business hours.
      </p>

      <!-- Summary Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.gray50};border:1px solid ${BRAND.gray200};border-radius:8px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid ${BRAND.gray200};color:${BRAND.gray500};font-size:13px;font-family:${BRAND.fontStack};width:45%;">Service Requested</td>
                <td style="padding:8px 0;border-bottom:1px solid ${BRAND.gray200};color:${BRAND.gray900};font-size:13px;font-weight:700;font-family:${BRAND.fontStack};">${serviceType}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid ${BRAND.gray200};color:${BRAND.gray500};font-size:13px;font-family:${BRAND.fontStack};">Your ZIP Code</td>
                <td style="padding:8px 0;border-bottom:1px solid ${BRAND.gray200};color:${BRAND.gray900};font-size:13px;font-weight:700;font-family:${BRAND.fontStack};">${zip}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${BRAND.gray500};font-size:13px;font-family:${BRAND.fontStack};">Best Time to Call</td>
                <td style="padding:8px 0;color:${BRAND.gray900};font-size:13px;font-weight:700;font-family:${BRAND.fontStack};">${callbackPreference}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- What to expect -->
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:${BRAND.navy};text-transform:uppercase;letter-spacing:0.06em;font-family:${BRAND.fontStack};">What to expect</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${BRAND.gray100};">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width:28px;vertical-align:top;padding-top:2px;">
                  <span style="font-size:16px;color:${BRAND.orange};">•</span>
                </td>
                <td style="font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.6;">They will call from a local number</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${BRAND.gray100};">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width:28px;vertical-align:top;padding-top:2px;">
                  <span style="font-size:16px;color:${BRAND.orange};">•</span>
                </td>
                <td style="font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.6;">The consultation is completely free</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width:28px;vertical-align:top;padding-top:2px;">
                  <span style="font-size:16px;color:${BRAND.orange};">•</span>
                </td>
                <td style="font-size:14px;color:${BRAND.gray700};font-family:${BRAND.fontStack};line-height:1.6;">No obligation to hire — get the quote and decide at your own pace</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${supportPhone ? `<p style="margin:0;font-size:13px;color:${BRAND.gray500};font-family:${BRAND.fontStack};text-align:center;">
        Questions? Call or text us at <a href="tel:${supportPhone}" style="color:${BRAND.orange};text-decoration:none;">${supportPhone}</a>
      </p>` : `<p style="margin:0;font-size:13px;color:${BRAND.gray500};font-family:${BRAND.fontStack};text-align:center;">
        Questions? Reply to this email and we will get back to you.
      </p>`}

    </td>
  </tr>`

  return htmlWrapper(`
    ${header}
    ${body}
    ${homeownerFooter()}
  `)
}
