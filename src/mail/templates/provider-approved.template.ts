import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function providerApprovedTemplate(input: EmailTemplateVariables & { businessName?: string }): EmailTemplateResult {
  const businessName = escapeHtml(input.businessName ?? 'your provider account');
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin:8px auto 0;text-align:center;">
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;"><strong>Business:</strong> ${businessName}</p>
    <p style="margin:0;color:#16A34A;font-size:15px;font-weight:700;">Approval status: Approved</p>
  </div>`;
  return { subject: input.title, text: buildPlainText(input, [`Business: ${input.businessName ?? 'your provider account'}`, 'Approval status: Approved']), html: layoutTemplate({ ...input, contentHtml }) };
}
