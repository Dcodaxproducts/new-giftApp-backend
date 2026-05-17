import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UploadedFileStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MailerService } from '../../mailer/mailer.service';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { SystemSettingsService } from '../services/system-settings.service';

const now = new Date('2026-05-16T10:00:00.000Z');
const passwordPolicy = { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumber: true, requireSymbol: true };
const settings = { id: 'settings_1', applicationName: 'Gift App', supportEmail: 'support@giftapp.com', platformLogoUrl: 'https://cdn.example.com/logo.png', sessionTimeoutMinutes: 30, adminMfaRequired: true, passwordPolicyJson: passwordPolicy, defaultCurrency: 'USD', transactionFeePercent: new Prisma.Decimal(2.5), pushNotificationsEnabled: true, emailNotificationsEnabled: true, updatedById: 'admin_1', createdAt: now, updatedAt: now, updatedBy: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' } };
const dto = { platformInfo: { applicationName: 'Gift App', supportEmail: 'support@giftapp.com', platformLogoUrl: 'https://cdn.example.com/logo.png' }, security: { sessionTimeoutMinutes: 30, adminMfaRequired: true, passwordPolicy }, payments: { defaultCurrency: 'USD', transactionFeePercent: 2.5 }, notifications: { pushNotificationsEnabled: true, emailNotificationsEnabled: true } };
const user = { uid: 'admin_1', role: UserRole.ADMIN };

function createService(overrides: { settings?: typeof settings | null; uploadStatus?: UploadedFileStatus } = {}) {
  const prisma = { systemSettings: { findFirst: jest.fn().mockResolvedValue(overrides.settings === undefined ? settings : overrides.settings), create: jest.fn().mockResolvedValue(settings), update: jest.fn().mockResolvedValue(settings) }, uploadedFile: { findFirst: jest.fn().mockResolvedValue({ id: 'upload_1', fileUrl: 'https://cdn.example.com/logo.png', status: overrides.uploadStatus ?? UploadedFileStatus.COMPLETED, folder: 'admin-avatars' }) }, adminAuditLog: { findMany: jest.fn().mockResolvedValue([{ id: 'audit_1', action: 'SYSTEM_SETTINGS_UPDATED', beforeJson: {}, afterJson: {}, createdAt: now, actor: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' } }]), count: jest.fn().mockResolvedValue(1) }, $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)) };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn((key: string, fallback?: string) => ({ MAIL_HOST: 'smtp.example.com', MAIL_USERNAME: 'mailer', MAIL_PASSWORD: 'secret', MAIL_FROM_ADDRESS: 'noreply@giftapp.com' }[key] ?? fallback)) };
  const mailer = { sendProviderMessageEmail: jest.fn().mockResolvedValue(undefined) };
  return { service: new SystemSettingsService(new SystemSettingsRepository(prisma as never), auditLog as never, configService as unknown as ConfigService, mailer as unknown as MailerService), prisma, auditLog, mailer };
}

describe('SystemSettingsService', () => {
  it('reads settings without exposing SMTP secrets', async () => {
    const { service } = createService();
    const response = await service.get();
    expect(response.data).toMatchObject({ platformInfo: { applicationName: 'Gift App' }, security: { passwordPolicy }, payments: { defaultCurrency: 'USD', transactionFeePercent: 2.5 }, notifications: { smtpConfigured: true } });
    expect(JSON.stringify(response.data)).not.toContain('secret');
    expect(JSON.stringify(response.data)).not.toContain('MAIL_PASSWORD');
  });

  it('updates settings and writes future-effect audit log', async () => {
    const { service, prisma, auditLog } = createService();
    await service.update(user, dto);
    expect(prisma.systemSettings.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'settings_1' } }));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SYSTEM_SETTINGS_UPDATED', metadataJson: { sessionTimeoutAffectsFutureSessionsOnly: true, paymentFeeAffectsFutureTransactionsOnly: true } }));
  });

  it('validates DTO constraints for security and payments', () => {
    const source = readFileSync(join(__dirname, '../dto/system-settings.dto.ts'), 'utf8');
    expect(source).toContain('@Min(8) @Max(128) minLength');
    expect(source).toContain('@Min(5) @Max(1440) sessionTimeoutMinutes');
    expect(source).toContain('@IsISO4217CurrencyCode() defaultCurrency');
    expect(source).toContain('@Min(0) @Max(100) transactionFeePercent');
  });

  it('updates logo using completed storage upload reference', async () => {
    const { service, prisma, auditLog } = createService();
    await service.updateLogo(user, { uploadId: 'upload_1', platformLogoUrl: 'https://cdn.example.com/logo.png' });
    expect(prisma.uploadedFile.findFirst).toHaveBeenCalled();
    const updateCalls = prisma.systemSettings.update.mock.calls as unknown[][];
    expect(updateCalls[0]?.[0]).toMatchObject({ data: { platformLogoUrl: 'https://cdn.example.com/logo.png' } });
    const auditCalls = auditLog.write.mock.calls as unknown[][];
    expect(auditCalls[0]?.[0]).toMatchObject({ action: 'SYSTEM_SETTINGS_LOGO_UPDATED', metadataJson: { usesStorageUploadReference: true } });
  });

  it('rejects non-completed logo upload references', async () => {
    const { service } = createService({ uploadStatus: UploadedFileStatus.PENDING });
    await expect(service.updateLogo(user, { uploadId: 'upload_1', platformLogoUrl: 'https://cdn.example.com/logo.png' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends SMTP test through configured mailer and audits it', async () => {
    const { service, mailer, auditLog } = createService();
    const response = await service.testSmtp(user, { to: 'admin@giftapp.com' });
    expect(response.data).toEqual({ sent: true, to: 'admin@giftapp.com', smtpConfigured: true });
    expect(mailer.sendProviderMessageEmail).toHaveBeenCalledWith('admin@giftapp.com', 'Gift App SMTP test', expect.any(String));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SYSTEM_SETTINGS_SMTP_TEST_SENT' }));
  });

  it('returns audit logs', async () => {
    const { service } = createService();
    await expect(service.auditLogs({ page: 1, limit: 20 })).resolves.toMatchObject({ data: [{ id: 'audit_1', action: 'SYSTEM_SETTINGS_UPDATED', actor: { id: 'admin_1', name: 'Alex Rivera' } }], meta: { total: 1 } });
  });
});

describe('System settings API stability', () => {
  const controller = readFileSync(join(__dirname, '../controllers/system-settings.controller.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/system-settings.repository.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../../swagger-access.ts'), 'utf8');
  it('adds required routes, repository, schema, permissions, and Swagger group', () => {
    expect(schema).toContain('model SystemSettings');
    expect(repository).toContain('export class SystemSettingsRepository');
    for (const route of ['@Get()', '@Patch()', "@Post('logo')", "@Post('smtp/test')", "@Get('audit-logs')"]) expect(controller).toContain(route);
    expect(controller).toContain("@ApiTags('02 Admin - System Settings')");
    expect(permissions).toContain("module: 'systemSettings'");
    expect(main).toContain("'02 Admin - System Settings'");
    expect(swaggerAccess).toContain('GET /api/v1/admin/system-settings');
  });
});
