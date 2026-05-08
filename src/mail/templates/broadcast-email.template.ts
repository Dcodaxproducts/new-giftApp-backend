import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function broadcastEmailTemplate(input: EmailTemplateVariables & { imageUrl?: string; ctaLabel?: string }): EmailTemplateResult {
  const contentHtml = `${input.imageUrl ? `<img src="${escapeHtml(input.imageUrl)}" alt="${escapeHtml(input.title)}" style="display:block;width:100%;max-width:544px;border-radius:14px;border:0;margin:8px 0 18px;" />` : ''}
    <div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin-top:8px;color:#111827;font-size:15px;line-height:1.6;">${escapeHtml(input.message)}</div>`;
  return { subject: input.title, text: buildPlainText({ ...input, ctaText: input.ctaLabel ?? input.ctaText }), html: layoutTemplate({ ...input, ctaText: input.ctaLabel ?? input.ctaText, contentHtml }) };
}
