import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function otpEmailTemplate(input: EmailTemplateVariables): EmailTemplateResult {
  const expiry = input.expiryMinutes ?? 10;
  const contentHtml = `<div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:14px;padding:22px;text-align:center;margin:8px auto 4px;">
    <div style="font-size:14px;color:#6B7280;margin-bottom:8px;">Your verification code is:</div>
    <div style="font-size:36px;letter-spacing:8px;font-weight:800;color:#8B5CF6;line-height:1;">${escapeHtml(input.otp ?? '')}</div>
    <div style="font-size:13px;color:#6B7280;margin-top:12px;">This code expires in ${expiry} minutes.</div>
  </div>`;
  return {
    subject: input.title,
    text: buildPlainText(input, [`Your verification code is: ${input.otp ?? ''}`, `This code expires in ${expiry} minutes.`]),
    html: layoutTemplate({ ...input, contentHtml }),
  };
}
