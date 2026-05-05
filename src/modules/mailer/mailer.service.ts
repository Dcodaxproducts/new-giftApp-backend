import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Verify your Gift App email',
      text: `Your Gift App verification OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your Gift App verification OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Reset your Gift App password',
      text: `Your Gift App password reset OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your Gift App password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  }

  isEnabled(): boolean {
    return this.configService.get<string>('EMAIL_ENABLED', 'false') === 'true';
  }

  private async sendMail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.getTransporter().sendMail({
        from: this.configService.get<string>('MAIL_FROM_ADDRESS'),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${input.to}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException('Email service is unavailable');
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const port = Number(this.configService.get<string>('MAIL_PORT', '587'));
    const encryption = this.configService.get<string>('MAIL_ENCRYPTION', 'tls');

    this.transporter = nodemailer.createTransport({
      host: this.required('MAIL_HOST'),
      port,
      secure: encryption === 'ssl' || port === 465,
      auth: {
        user: this.required('MAIL_USERNAME'),
        pass: this.required('MAIL_PASSWORD'),
      },
    });

    return this.transporter;
  }

  private required(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException(`${key} is required for email delivery`);
    }

    return value;
  }
}
