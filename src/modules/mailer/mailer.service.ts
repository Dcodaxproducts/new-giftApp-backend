import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { accountSuspendedTemplate } from '../../mail/templates/account-suspended.template';
import { adminPasswordChangedTemplate } from '../../mail/templates/admin-password-changed.template';
import { adminInviteTemplate } from '../../mail/templates/admin-invite.template';
import { broadcastEmailTemplate } from '../../mail/templates/broadcast-email.template';
import { EmailTemplateResult, EmailTemplateVariables, layoutTemplate, buildPlainText } from '../../mail/templates/layout.template';
import { otpEmailTemplate } from '../../mail/templates/otp-email.template';
import { providerApprovedTemplate } from '../../mail/templates/provider-approved.template';
import { providerInviteTemplate } from '../../mail/templates/provider-invite.template';
import { providerRejectedTemplate } from '../../mail/templates/provider-rejected.template';
import { resetPasswordTemplate } from '../../mail/templates/reset-password.template';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    await this.sendTemplate(email, otpEmailTemplate({ ...this.brand(), title: 'Verify your email', message: 'Use this code to complete your Gift App email verification.', otp, expiryMinutes: 10 }));
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
    await this.sendTemplate(email, resetPasswordTemplate({ ...this.brand(), title: 'Reset your password', message: 'Use this code to reset your Gift App password.', otp, expiryMinutes: 10 }));
  }

  async sendAdminChangedPasswordEmail(input: { email: string; userName: string; newPassword: string }): Promise<void> {
    await this.sendTemplate(input.email, adminPasswordChangedTemplate({
      ...this.brand(),
      userName: input.userName,
      newPassword: input.newPassword,
      title: 'Your Gift App password has been changed',
      message: 'Your Gift App password was changed by the support/admin team.',
      ctaText: 'Open Gift App',
      ctaUrl: this.frontendUrl(),
    }));
  }

  async sendAccountStatusEmail(email: string, status: string, comment?: string): Promise<void> {
    const normalizedStatus = status.toUpperCase();
    const template = normalizedStatus.includes('APPROVED')
      ? providerApprovedTemplate({ ...this.brand(), title: 'Provider account approved', message: 'Your provider account has been approved. You can now continue setup in Gift App.', businessName: 'Your business', ctaText: 'Open Gift App', ctaUrl: this.frontendUrl() })
      : normalizedStatus.includes('REJECTED')
        ? providerRejectedTemplate({ ...this.brand(), title: 'Provider account update', message: 'Your provider application needs attention before it can be approved.', businessName: 'Your business', reason: status, comment, ctaText: 'Review application', ctaUrl: this.frontendUrl() })
        : accountSuspendedTemplate({ ...this.brand(), title: `Account status: ${status}`, message: `Your Gift App account status is now ${status}.`, status, comment, ctaText: 'Open Gift App', ctaUrl: this.frontendUrl() });
    await this.sendTemplate(email, template);
  }

  async sendProviderApprovedEmail(email: string, businessName: string): Promise<void> {
    await this.sendTemplate(email, providerApprovedTemplate({ ...this.brand(), title: 'Provider account approved', message: 'Your provider account has been approved. You can now continue setup in Gift App.', businessName, ctaText: 'Open Gift App', ctaUrl: this.frontendUrl() }));
  }

  async sendProviderRejectedEmail(email: string, businessName: string, reason?: string, comment?: string): Promise<void> {
    await this.sendTemplate(email, providerRejectedTemplate({ ...this.brand(), title: 'Provider account update', message: 'Your provider application needs attention before it can be approved.', businessName, reason, comment, ctaText: 'Review application', ctaUrl: this.frontendUrl() }));
  }

  async sendProviderInviteEmail(input: { email: string; providerName: string; businessName: string; temporaryPassword?: string; mustChangePassword?: boolean; approvalStatus: string; ctaUrl?: string }): Promise<void> {
    await this.sendTemplate(input.email, providerInviteTemplate({
      ...this.brand(),
      providerName: input.providerName,
      businessName: input.businessName,
      userEmail: input.email,
      temporaryPassword: input.temporaryPassword,
      mustChangePassword: input.mustChangePassword,
      approvalStatus: input.approvalStatus,
      title: 'You have been invited to Gift App Provider Portal',
      message: 'A provider account has been created for you.',
      ctaText: 'Open Provider Portal',
      ctaUrl: input.ctaUrl ?? this.frontendUrl(),
    }));
  }

  async sendProviderMessageEmail(email: string, subject: string, message: string): Promise<void> {
    const contentHtml = `<div style="border:1px solid #E5E7EB;border-radius:14px;padding:18px;margin-top:8px;color:#111827;font-size:15px;line-height:1.6;">${this.escape(message)}</div>`;
    await this.sendTemplate(email, { subject, text: buildPlainText({ ...this.brand(), title: subject, message }), html: layoutTemplate({ ...this.brand(), title: subject, message, contentHtml }) });
  }

  async sendAdminInviteEmail(input: { email: string; userName: string; temporaryPassword?: string; mustChangePassword?: boolean; ctaUrl?: string }): Promise<void> {
    await this.sendTemplate(input.email, adminInviteTemplate({
      ...this.brand(),
      userName: input.userName,
      userEmail: input.email,
      temporaryPassword: input.temporaryPassword,
      mustChangePassword: input.mustChangePassword,
      title: 'You are invited to Gift App Admin',
      message: 'An admin account has been created for you.',
      ctaText: 'Open Admin Panel',
      ctaUrl: input.ctaUrl ?? this.frontendUrl(),
    }));
  }

  async sendBroadcastEmail(input: { to: string; title: string; message: string; imageUrl?: string | null; ctaLabel?: string | null; ctaUrl?: string | null }): Promise<void> {
    await this.sendTemplate(input.to, broadcastEmailTemplate({ ...this.brand(), title: input.title, message: input.message, imageUrl: input.imageUrl ?? undefined, ctaLabel: input.ctaLabel ?? undefined, ctaText: input.ctaLabel ?? undefined, ctaUrl: input.ctaUrl ?? undefined }));
  }

  isEnabled(): boolean {
    return this.configService.get<string>('EMAIL_ENABLED', 'false') === 'true';
  }

  private async sendTemplate(to: string, template: EmailTemplateResult): Promise<void> {
    await this.sendMail({ to, subject: template.subject, text: template.text, html: template.html });
  }

  private async sendMail(input: { to: string; subject: string; text: string; html: string }): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.warn(`EMAIL_ENABLED is false; skipped email to ${input.to} (${input.subject})`);
      return;
    }

    try {
      const from = this.fromAddress();
      this.logger.log(`Sending email to ${input.to} via ${this.safeMailerConfig()} with subject "${input.subject}"`);
      await this.getTransporter().sendMail({ from, to: input.to, subject: input.subject, text: input.text, html: input.html });
      this.logger.log(`Email send completed for ${input.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${input.to} via ${this.safeMailerConfig()}`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('Email service is unavailable');
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    const port = Number(this.configService.get<string>('MAIL_PORT', '587'));
    const encryption = this.configService.get<string>('MAIL_ENCRYPTION', 'tls');
    this.logger.log(`Initializing SMTP transporter: ${this.safeMailerConfig()}`);
    this.transporter = nodemailer.createTransport({
      host: this.required('MAIL_HOST'),
      port,
      secure: encryption === 'ssl' || port === 465,
      auth: { user: this.required('MAIL_USERNAME'), pass: this.required('MAIL_PASSWORD') },
    });
    return this.transporter;
  }

  private brand(): EmailTemplateVariables {
    return {
      appName: this.configService.get<string>('APP_NAME', 'Gift App'),
      logoUrl: this.configService.get<string>('APP_LOGO_URL'),
      supportEmail: this.configService.get<string>('APP_SUPPORT_EMAIL', 'support@giftapp.com'),
      title: 'Gift App',
      message: 'Because every gift matters',
    };
  }

  private frontendUrl(): string {
    return this.configService.get<string>('APP_FRONTEND_URL', 'https://app.giftapp.com');
  }

  private fromAddress(): string {
    const address = this.configService.get<string>('MAIL_FROM_ADDRESS');
    if (!address) throw new ServiceUnavailableException('MAIL_FROM_ADDRESS is required for email delivery');
    const name = this.configService.get<string>('EMAIL_FROM_NAME', this.configService.get<string>('APP_NAME', 'Gift App'));
    return `"${name.replaceAll('"', '')}" <${address}>`;
  }

  private required(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new ServiceUnavailableException(`${key} is required for email delivery`);
    return value;
  }

  private safeMailerConfig(): string {
    const host = this.configService.get<string>('MAIL_HOST', 'missing-host');
    const port = this.configService.get<string>('MAIL_PORT', 'missing-port');
    const encryption = this.configService.get<string>('MAIL_ENCRYPTION', 'missing-encryption');
    const username = this.configService.get<string>('MAIL_USERNAME', 'missing-username');
    const from = this.configService.get<string>('MAIL_FROM_ADDRESS', 'missing-from');
    return `host=${host} port=${port} encryption=${encryption} username=${username} from=${from}`;
  }

  private escape(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }
}
