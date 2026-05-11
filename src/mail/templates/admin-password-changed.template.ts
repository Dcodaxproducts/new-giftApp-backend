import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function adminPasswordChangedTemplate(input: EmailTemplateVariables & { newPassword: string }): EmailTemplateResult {
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin:8px auto 0;text-align:center;">
    <p style="margin:0 0 12px;color:#111827;font-size:15px;line-height:1.6;">Hello ${escapeHtml(input.userName ?? 'there')},</p>
    <p style="margin:0 0 12px;color:#111827;font-size:15px;line-height:1.6;">Your Gift App password was changed by the support/admin team.</p>
    <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:12px;padding:14px;margin:12px auto;color:#111827;font-size:15px;line-height:1.6;">
      <strong>New Password:</strong> ${escapeHtml(input.newPassword)}
    </div>
    <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">Please log in and update your password if you did not request this change.</p>
  </div>`;

  return {
    subject: 'Your Gift App password has been changed',
    text: buildPlainText(
      {
        ...input,
        title: 'Your Gift App password has been changed',
        message: 'Your Gift App password was changed by the support/admin team.',
        ctaText: 'Open Gift App',
      },
      [`New Password: ${input.newPassword}`, 'Please log in and update your password if you did not request this change.'],
    ),
    html: layoutTemplate({
      ...input,
      title: 'Your Gift App password has been changed',
      message: 'Your Gift App password was changed by the support/admin team.',
      ctaText: 'Open Gift App',
      contentHtml,
    }),
  };
}
