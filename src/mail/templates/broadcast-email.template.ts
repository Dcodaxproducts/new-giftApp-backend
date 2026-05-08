import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function broadcastEmailTemplate(input: EmailTemplateVariables & { imageUrl?: string; ctaLabel?: string }): EmailTemplateResult {
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin:8px auto 0;color:#111827;font-size:15px;line-height:1.6;text-align:center;">${escapeHtml(input.message)}</div>`;
  return { subject: input.title, text: buildPlainText({ ...input, ctaText: input.ctaLabel ?? input.ctaText }), html: layoutTemplate({ ...input, ctaText: input.ctaLabel ?? input.ctaText, contentHtml }) };
}
