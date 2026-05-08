import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function adminInviteTemplate(input: EmailTemplateVariables & { temporaryPassword?: string }): EmailTemplateResult {
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin-top:8px;">
    <p style="margin:0 0 10px;color:#111827;font-size:15px;line-height:1.6;">You have been invited to manage ${escapeHtml(input.appName)}.</p>
    ${input.temporaryPassword ? `<p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">Use the temporary password shared through the secure admin flow and change it after first login.</p>` : ''}
  </div>`;
  return { subject: input.title, text: buildPlainText(input), html: layoutTemplate({ ...input, contentHtml }) };
}
