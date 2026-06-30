import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SystemSettingsRepository } from './system-settings.repository';
import { SystemSettingsService } from './system-settings.service';

const now = new Date('2026-05-16T10:00:00.000Z');
const settings = {
  id: 'settings_1',
  applicationName: 'Gift App',
  supportEmail: 'support@giftapp.com',
  platformLogoUrl: 'https://cdn.example.com/logo.png',
  stripePublishableKey: 'pk_live_123',
  stripeSecretKey: 'sk_live_123',
  stripeWebhookSecret: 'whsec_123',
  firebaseServiceAccountJson: { type: 'service_account', private_key: 'secret' },
  awsS3BucketName: 'gift-assets',
  awsRegion: 'us-east-1',
  awsAccessKey: 'aws_access',
  awsSecretKey: 'aws_secret',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUsername: 'mailer',
  smtpPassword: 'smtp_secret',
  senderEmail: 'noreply@giftapp.com',
  senderName: 'Gift App',
  updatedById: 'admin_1',
  createdAt: now,
  updatedAt: now,
  updatedBy: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' },
};
const dto = {
  platformInfo: { applicationName: 'FintechOS Enterprise', supportEmail: 'support@fintechos.io', platformLogoUrl: 'https://cdn.example.com/new-logo.png' },
  payments: { stripePublishableKey: 'pk_live_new', stripeSecretKey: '************', stripeWebhookSecret: 'whsec_new' },
  firebase: { firebaseServiceAccountJson: '{"type":"service_account","project_id":"gift-platform"}' },
  storage: { awsS3BucketName: 'new-bucket', awsRegion: 'eu-west-1', awsAccessKey: '************', awsSecretKey: 'aws_secret_new' },
  email: { smtpHost: 'smtp.mailtrap.io', smtpPort: 2525, smtpUsername: 'smtp-user', smtpPassword: '************', senderEmail: 'sender@giftapp.com', senderName: 'Gift Platform' },
};
const user = { uid: 'admin_1', role: UserRole.ADMIN };

function createService(overrides: { settings?: typeof settings | null } = {}) {
  const prisma = {
    systemSettings: {
      findFirst: jest.fn().mockResolvedValue(overrides.settings === undefined ? settings : overrides.settings),
      create: jest.fn().mockResolvedValue(settings),
      update: jest.fn().mockImplementation((_args) => Promise.resolve({ ...settings, ..._args.data })),
    },
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn((key: string, fallback?: string) => ({ MAIL_HOST: 'smtp.example.com', MAIL_USERNAME: 'mailer', MAIL_PASSWORD: 'secret', MAIL_FROM_ADDRESS: 'noreply@giftapp.com' }[key] ?? fallback)) };
  return { service: new SystemSettingsService(new SystemSettingsRepository(prisma as never), auditLog as never, configService as unknown as ConfigService), prisma, auditLog };
}

describe('SystemSettingsService', () => {
  it('reads dashboard settings with secrets masked', async () => {
    const { service } = createService();
    const response = await service.get();
    expect(response.data).toMatchObject({
      platformInfo: { applicationName: 'Gift App' },
      payments: { stripePublishableKey: 'pk_live_123', stripeSecretKey: '************', stripeWebhookSecret: '************' },
      firebase: { firebaseServiceAccountJson: '************' },
      storage: { awsS3BucketName: 'gift-assets', awsAccessKey: '************', awsSecretKey: '************' },
      email: { smtpHost: 'smtp.example.com', smtpPassword: '************' },
    });
    expect(JSON.stringify(response.data)).not.toContain('sk_live_123');
    expect(JSON.stringify(response.data)).not.toContain('smtp_secret');
  });

  it('updates settings while preserving masked secret values', async () => {
    const { service, prisma, auditLog } = createService();
    await service.update(user, dto);
    expect(prisma.systemSettings.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'settings_1' },
      data: expect.objectContaining({
        applicationName: 'FintechOS Enterprise',
        stripePublishableKey: 'pk_live_new',
        stripeSecretKey: 'sk_live_123',
        stripeWebhookSecret: 'whsec_new',
        awsAccessKey: 'aws_access',
        awsSecretKey: 'aws_secret_new',
        smtpPassword: 'smtp_secret',
        firebaseServiceAccountJson: { type: 'service_account', project_id: 'gift-platform' },
      }),
    }));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SYSTEM_SETTINGS_UPDATED', targetType: 'SYSTEM_SETTINGS' }));
  });

  it('rejects invalid firebase service account JSON', async () => {
    const { service } = createService();
    await expect(service.update(user, { ...dto, firebase: { firebaseServiceAccountJson: '{bad json' } })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts null optional values and stores stable logo URLs', async () => {
    const { service, prisma } = createService();
    await service.update(user, {
      ...dto,
      platformInfo: { ...dto.platformInfo, platformLogoUrl: 'https://cdn.example.com/platform-logos/logo.jpg?X-Amz-Signature=signed' },
      firebase: { firebaseServiceAccountJson: null },
      email: { ...dto.email, senderName: null },
    } as never);
    expect(prisma.systemSettings.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        platformLogoUrl: 'https://cdn.example.com/platform-logos/logo.jpg',
        firebaseServiceAccountJson: { type: 'service_account', private_key: 'secret' },
        senderName: null,
      }),
    }));
  });

  it('validates DTO constraints for dashboard sections', () => {
    const source = readFileSync(join(__dirname, 'dto/system-settings.dto.ts'), 'utf8');
    for (const text of ['PaymentProviderSettingsDto', 'FirebaseSettingsDto', 'StorageSettingsDto', 'EmailSettingsDto', 'stripePublishableKey', 'awsS3BucketName', 'smtpPort']) expect(source).toContain(text);
    expect(source).not.toContain('SecuritySettingsDto');
    expect(source).not.toContain('NotificationSettingsDto');
  });
});

describe('System settings API stability', () => {
  const controller = readFileSync(join(__dirname, 'system-settings.controller.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'system-settings.repository.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../swagger-access.ts'), 'utf8');
  it('adds required routes, repository, schema, permissions, and Swagger group', () => {
    expect(schema).toContain('model SystemSettings');
    expect(schema).toContain('stripePublishableKey');
    expect(schema).toContain('firebaseServiceAccountJson');
    expect(repository).toContain('export class SystemSettingsRepository');
    for (const route of ['@Get()', '@Patch()']) expect(controller).toContain(route);
    for (const removedRoute of ["@Post('logo')", "@Post('smtp/test')", "@Get('audit-logs')"]) expect(controller).not.toContain(removedRoute);
    expect(controller).toContain("@ApiTags('02 Admin - System Settings')");
    expect(permissions).toContain("module: 'systemSettings'");
    expect(main).toContain("'02 Admin - System Settings'");
    expect(swaggerAccess).toContain('GET /api/v1/admin/system-settings');
    expect(swaggerAccess).not.toContain('POST /api/v1/admin/system-settings/logo');
  });
});
