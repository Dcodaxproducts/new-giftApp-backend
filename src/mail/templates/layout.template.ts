export interface EmailTemplateVariables {
  appName: string;
  logoUrl?: string;
  userName?: string;
  title: string;
  message: string;
  otp?: string;
  ctaText?: string;
  ctaUrl?: string;
  expiryMinutes?: number;
  supportEmail?: string;
}

export interface EmailTemplateResult {
  subject: string;
  text: string;
  html: string;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildPlainText(input: EmailTemplateVariables, lines: string[] = []): string {
  return [
    input.title,
    '',
    input.userName ? `Hi ${input.userName},` : '',
    input.message,
    ...lines,
    input.ctaUrl ? `${input.ctaText ?? 'Open'}: ${input.ctaUrl}` : '',
    '',
    `Security note: ${input.appName} will never ask for your password or OTP outside the app.`,
    `Support: ${input.supportEmail ?? 'support@giftapp.com'}`,
  ].filter(Boolean).join('\n');
}

export function layoutTemplate(input: EmailTemplateVariables & { contentHtml: string }): string {
  const appName = escapeHtml(input.appName);
  const supportEmail = escapeHtml(input.supportEmail ?? 'support@giftapp.com');
  const preheader = escapeHtml(input.message);
  const cta = input.ctaUrl
    ? `<tr><td align="center" style="padding:24px 0 8px;"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#8B5CF6;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:10px;font-size:15px;font-weight:700;">${escapeHtml(input.ctaText ?? 'Open Gift App')}</a></td></tr>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" align="center" style="background:#F9FAFB;margin:0 auto;padding:24px 12px;text-align:center;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;border-radius:18px;overflow:hidden;text-align:center;">
            <tr>
              <td style="padding:32px 28px 16px;text-align:center;background:#ffffff;">
                <div style="font-size:24px;font-weight:800;color:#111827;line-height:1.25;">${appName}</div>
                <div style="font-size:14px;color:#6B7280;margin-top:4px;">Because every gift matters</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 4px;">
                <h1 style="text-align:center; margin:0; font-size:24px; color:#111827;">${escapeHtml(input.title)}</h1>
                <p style="text-align:center; margin:12px 0 0; color:#6B7280; font-size:15px; line-height:22px;">${escapeHtml(input.message)}</p>
              </td>
            </tr>
            <tr><td align="center" style="padding:18px 28px 0;text-align:center;">${input.contentHtml}</td></tr>
            ${cta}
            <tr>
              <td align="center" style="padding:20px 28px 28px;text-align:center;">
                <div style="border-top:1px solid #E5E7EB;padding-top:16px;color:#6B7280;font-size:13px;line-height:1.6;text-align:center;">
                  <strong style="color:#111827;">Security note:</strong> ${appName} will never ask for your password or OTP outside the app.<br>
                  Need help? Contact <a href="mailto:${supportEmail}" style="color:#8B5CF6;text-decoration:none;">${supportEmail}</a>.
                </div>
              </td>
            </tr>
          </table>
          <div style="max-width:600px;margin:16px auto 0;color:#6B7280;font-size:12px;line-height:1.5;text-align:center;">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
