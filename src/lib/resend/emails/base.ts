// ============================================================
// TradeReach Email Base â Shared layout primitives
// All emails are rendered as inline-CSS HTML strings for
// maximum compatibility across Gmail, Outlook, Apple Mail,
// and mobile clients.
// ============================================================

export const BRAND = {
  navy: '#0a1628',
  orange: '#f97316',
  lightNavy: '#132238',
  white: '#ffffff',
  offWhite: '#f8fafc',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  red: '#dc2626',
  fontStack: 'Arial, Helvetica, sans-serif',
  maxWidth: '600px',
  address: 'TradeReach &bull; Vacaville, CA 95688',
}

/** Bulletproof HTML wrapper â doctype + full meta */
export function htmlWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>TradeReach</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:${BRAND.fontStack};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;">
    <tr>
      <td style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:${BRAND.maxWidth};margin:0 auto;">
          ${bodyContent}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Navy header with TradeReach wordmark */
export function emailHeader(subtitle?: string): string {
  return `<tr>
    <td style="background-color:${BRAND.navy};border-radius:8px 8px 0 0;padding:28px 40px;text-align:center;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="text-align:center;">
            <div style="display:inline-block;">
              <span style="font-family:${BRAND.fontStack};font-size:26px;font-weight:800;color:${BRAND.orange};letter-spacing:-0.5px;">Trade</span><span style="font-family:${BRAND.fontStack};font-size:26px;font-weight:800;color:${BRAND.white};letter-spacing:-0.5px;">Reach</span>
            </div>
            ${subtitle ? `<p style="margin:6px 0 0;font-size:12px;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;font-family:${BRAND.fontStack};">${subtitle}</p>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

/** White card body wrapper */
export function emailBody(content: string): string {
  return `<tr>
    <td style="background-color:${BRAND.white};padding:40px;">
      ${content}
    </td>
  </tr>`
}

/** Standard contractor footer */
export function contractorFooter(unsubscribeUrl?: string): string {
  return `<tr>
    <td style="background-color:${BRAND.gray50};border-top:1px solid ${BRAND.gray200};border-radius:0 0 8px 8px;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">
        You are receiving this because you are a TradeReach contractor.
        ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color:${BRAND.gray500};">Manage notification settings</a>` : 'Manage notifications in your account settings.'}
      </p>
      <p style="margin:0;font-size:11px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">
        ${BRAND.address}
      </p>
      <p style="margin:6px 0 0;font-size:11px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">
        Need help? <a href="mailto:support@tradereachapp.com" style="color:${BRAND.orange};text-decoration:none;">support@tradereachapp.com</a>
      </p>
    </td>
  </tr>`
}

/** Homeowner-facing footer */
export function homeownerFooter(): string {
  return `<tr>
    <td style="background-color:${BRAND.gray50};border-top:1px solid ${BRAND.gray200};border-radius:0 0 8px 8px;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">
        Powered by <strong>TradeReach</strong> &mdash; Connecting homeowners with trusted local contractors.
      </p>
      <p style="margin:0;font-size:11px;color:${BRAND.gray500};font-family:${BRAND.fontStack};">
        ${BRAND.address}
      </p>
    </td>
  </tr>`
}

/** Bulletproof orange CTA button (works in Outlook) */
export function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="border-radius:6px;background-color:${BRAND.orange};" align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${url}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="12%" stroke="f" fillcolor="${BRAND.orange}">
          <w:anchorlock/>
          <center style="color:${BRAND.white};font-family:${BRAND.fontStack};font-size:16px;font-weight:700;">${label}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" target="_blank"
           style="display:inline-block;background-color:${BRAND.orange};color:${BRAND.white};font-family:${BRAND.fontStack};font-size:16px;font-weight:700;line-height:1;padding:16px 36px;text-decoration:none;border-radius:6px;">
          ${label}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`
}

/** Info row for lead detail cards */
export function detailRow(label: string, value: string, last = false): string {
  return `<tr>
    <td style="padding:12px 16px;${last ? '' : 'border-bottom:1px solid ' + BRAND.gray200 + ';'}color:${BRAND.gray500};font-family:${BRAND.fontStack};font-size:13px;width:40%;">${label}</td>
    <td style="padding:12px 16px;${last ? '' : 'border-bottom:1px solid ' + BRAND.gray200 + ';'}color:${BRAND.gray900};font-family:${BRAND.fontStack};font-size:13px;font-weight:700;">${value}</td>
  </tr>`
}

/** Stat card for monthly report */
export function statCard(label: string, value: string): string {
  return `<td style="width:50%;padding:4px;" valign="top">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="background-color:${BRAND.gray50};border-left:3px solid ${BRAND.orange};border-radius:4px;padding:16px 18px;">
          <p style="margin:0 0 4px;font-size:11px;color:${BRAND.gray500};text-transform:uppercase;letter-spacing:0.06em;font-family:${BRAND.fontStack};">${label}</p>
          <p style="margin:0;font-size:28px;font-weight:800;color:${BRAND.navy};font-family:${BRAND.fontStack};">${value}</p>
        </td>
      </tr>
    </table>
  </td>`
}

/** Step item for checklist */
export function checklistItem(text: string): string {
  return `<tr>
    <td style="padding:10px 0;" valign="top">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="width:28px;vertical-align:top;">
            <div style="width:22px;height:22px;border-radius:50%;background-color:${BRAND.orange};text-align:center;line-height:22px;">
              <span style="color:${BRAND.white};font-size:12px;font-weight:700;font-family:${BRAND.fontStack};">&#10003;</span>
            </div>
          </td>
          <td style="padding-left:12px;vertical-align:middle;">
            <p style="margin:0;font-size:15px;color:${BRAND.gray700};font-family:${BRAND.fontStack};">${text}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}
