import { buildPlainText, EmailTemplateResult, EmailTemplateVariables, escapeHtml, layoutTemplate } from './layout.template';

export function adminInviteTemplate(input: EmailTemplateVariables & {
  temporaryPassword?: string;
  userEmail: string;
  mustChangePassword?: boolean;
}): EmailTemplateResult {
  const lines = [
    `Login email: ${input.userEmail}`,
    input.temporaryPassword ? `Temporary password: ${input.temporaryPassword}` : '',
    input.mustChangePassword ? 'You must change your password after first login.' : '',
    `Support: ${input.supportEmail ?? 'support@giftapp.com'}`,
  ].filter(Boolean);
  const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin:8px auto 0;text-align:left;max-width:420px;">
    <p style="margin:0 0 12px;color:#111827;font-size:15px;line-height:1.6;text-align:center;">You have been invited to manage ${escapeHtml(input.appName)}.</p>
    <p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Name:</strong> ${escapeHtml(input.userName ?? 'Admin')}</p>
    <p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Login email:</strong> ${escapeHtml(input.userEmail)}</p>
    ${input.temporaryPassword ? `<p style="margin:0 0 8px;color:#111827;font-size:14px;line-height:1.6;"><strong>Temporary password:</strong> ${escapeHtml(input.temporaryPassword)}</p>` : ''}
    ${input.mustChangePassword ? '<p style="margin:0 0 8px;color:#6B7280;font-size:14px;line-height:1.6;">You must change your password after first login.</p>' : ''}
    <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">If you need help accessing the admin panel, contact support.</p>
  </div>`;
  return { subject: input.title, text: buildPlainText(input, lines), html: layoutTemplate({ ...input, contentHtml }) };
}
