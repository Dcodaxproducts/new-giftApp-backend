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
  const logo = input.logoUrl
    ? `<img src="${escapeHtml(input.logoUrl)}" width="72" alt="${appName}" style="display:block;border:0;outline:none;text-decoration:none;border-radius:18px;margin:0 auto 12px;max-width:72px;height:auto;" />`
    : `<div style="width:72px;height:72px;border-radius:18px;background:#8B5CF6;color:#ffffff;line-height:72px;text-align:center;font-size:28px;font-weight:700;margin:0 auto 12px;">🎁</div>`;
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #E5E7EB;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:32px 28px 16px;text-align:center;background:#ffffff;">
                ${logo}
                <div style="font-size:24px;font-weight:800;color:#111827;line-height:1.25;">${appName}</div>
                <div style="font-size:14px;color:#6B7280;margin-top:4px;">Because every gift matters</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 4px;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#111827;">${escapeHtml(input.title)}</h1>
                <p style="margin:0;color:#6B7280;font-size:16px;line-height:1.6;">${escapeHtml(input.message)}</p>
              </td>
            </tr>
            <tr><td style="padding:18px 28px 0;">${input.contentHtml}</td></tr>
            ${cta}
            <tr>
              <td style="padding:20px 28px 28px;">
                <div style="border-top:1px solid #E5E7EB;padding-top:16px;color:#6B7280;font-size:13px;line-height:1.6;">
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
