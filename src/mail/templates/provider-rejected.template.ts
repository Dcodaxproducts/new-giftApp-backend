import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function providerRejectedTemplate(input: EmailTemplateVariables & { businessName?: string; reason?: string; comment?: string }): EmailTemplateResult {
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin-top:8px;">
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;"><strong>Business:</strong> ${escapeHtml(input.businessName ?? 'your provider account')}</p>
    <p style="margin:0 0 8px;color:#DC2626;font-size:15px;font-weight:700;">Approval status: Rejected</p>
    ${input.reason ? `<p style="margin:0 0 8px;color:#6B7280;font-size:14px;line-height:1.6;"><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>` : ''}
    ${input.comment ? `<p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;"><strong>Comment:</strong> ${escapeHtml(input.comment)}</p>` : ''}
  </div>`;
  return { subject: input.title, text: buildPlainText(input, [`Business: ${input.businessName ?? 'your provider account'}`, 'Approval status: Rejected', input.reason ? `Reason: ${input.reason}` : '', input.comment ? `Comment: ${input.comment}` : '']), html: layoutTemplate({ ...input, contentHtml }) };
}
