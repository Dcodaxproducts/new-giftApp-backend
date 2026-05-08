import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function accountSuspendedTemplate(input: EmailTemplateVariables & { status?: string; comment?: string }): EmailTemplateResult {
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin:8px auto 0;text-align:center;">
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;"><strong>Status:</strong> ${escapeHtml(input.status ?? 'Updated')}</p>
    ${input.comment ? `<p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;"><strong>Comment:</strong> ${escapeHtml(input.comment)}</p>` : ''}
  </div>`;
  return { subject: input.title, text: buildPlainText(input, [`Status: ${input.status ?? 'Updated'}`, input.comment ? `Comment: ${input.comment}` : '']), html: layoutTemplate({ ...input, contentHtml }) };
}
