import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function providerInviteTemplate(input: EmailTemplateVariables & {
  providerName: string;
  businessName: string;
  userEmail: string;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
  approvalStatus: string;
}): EmailTemplateResult {
  const lines = [
    `Provider name: ${input.providerName}`,
    `Business name: ${input.businessName}`,
    `Login email: ${input.userEmail}`,
    input.temporaryPassword ? `Temporary password: ${input.temporaryPassword}` : '',
    `Provider portal: ${input.ctaUrl ?? ''}`,
    input.mustChangePassword ? 'You must change your password after first login.' : '',
    `Approval status: ${input.approvalStatus}`,
    `Support: ${input.supportEmail ?? 'support@giftapp.com'}`,
  ].filter(Boolean);
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin:8px auto 0;text-align:left;max-width:460px;">
    <p style="margin:0 0 12px;color:#111827;font-size:15px;line-height:1.6;text-align:center;">You have been invited to the ${escapeHtml(input.appName)} Provider Portal.</p>
    <p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Provider name:</strong> ${escapeHtml(input.providerName)}</p>
    <p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Business name:</strong> ${escapeHtml(input.businessName)}</p>
    <p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Login email:</strong> ${escapeHtml(input.userEmail)}</p>
    ${input.temporaryPassword ? `<p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Temporary password:</strong> ${escapeHtml(input.temporaryPassword)}</p>` : ''}
    <p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Approval status:</strong> ${escapeHtml(input.approvalStatus)}</p>
    ${input.mustChangePassword ? '<p style="margin:0 0 8px;color:#6B7280;font-size:14px;line-height:1.6;">You must change your password after first login.</p>' : ''}
    <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">If you need help accessing the provider portal, contact support.</p>
  </div>`;
  return {
    subject: 'You have been invited to Gift App Provider Portal',
    text: buildPlainText({ ...input, title: 'You have been invited to Gift App Provider Portal', message: 'A provider account has been created for you.' }, lines),
    html: layoutTemplate({ ...input, title: 'You have been invited to Gift App Provider Portal', message: 'A provider account has been created for you.', contentHtml }),
  };
}
