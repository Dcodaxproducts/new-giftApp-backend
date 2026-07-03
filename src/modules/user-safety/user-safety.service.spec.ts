/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole, UserSafetyAdminAction, UserSafetyReportReason, UserSafetyReportStatus, UserSafetySourceType } from '@prisma/client';
import { UserSafetyAdminRepository } from './repositories/user-safety-admin.repository';
import { BlockedUsersRepository } from './repositories/blocked-users.repository';
import { UserSafetyRepository } from './repositories/user-safety.repository';
import { UserSafetyAdminService } from './services/user-safety-admin.service';
import { UserSafetyService } from './services/user-safety.service';

const now = new Date('2026-05-18T10:00:00.000Z');
const customer = { id: 'customer_1', firstName: 'Sarah', lastName: 'Khan', avatarUrl: null, role: UserRole.REGISTERED_USER };
const reported = { id: 'reported_1', firstName: 'Bad', lastName: 'Actor', avatarUrl: null, role: UserRole.REGISTERED_USER };
const report = { id: 'report_1', reportId: 'USR-1', reporterUserId: customer.id, reportedUserId: reported.id, reporter: customer, reported, reason: UserSafetyReportReason.HARASSMENT, details: 'bad message', sourceType: UserSafetySourceType.CHAT, sourceId: 'thread_1', evidenceUrlsJson: ['https://cdn/user-report-evidence/a.png'], status: UserSafetyReportStatus.SUBMITTED, adminComment: null, reviewedById: null, reviewedAt: null, createdAt: now, updatedAt: now };

function createCustomerService(overrides: Partial<{ duplicate: unknown; block: unknown }> = {}) {
  const reports = { findUserById: jest.fn().mockResolvedValue(reported), findCompletedUploadsByUrls: jest.fn().mockResolvedValue([{ fileUrl: 'https://cdn/user-report-evidence/a.png' }]), findDuplicateActiveReport: jest.fn().mockResolvedValue(overrides.duplicate ?? null), createReport: jest.fn().mockResolvedValue(report), findReportsAndCount: jest.fn().mockResolvedValue([[report], 1]), findReportForUser: jest.fn().mockResolvedValue(report), findActiveAdminRecipients: jest.fn().mockResolvedValue([{ id: 'admin_1', role: UserRole.STAFF }]), createManyNotifications: jest.fn().mockResolvedValue({ count: 1 }) };
  const blocks = { findUserById: jest.fn().mockResolvedValue(reported), upsertBlock: jest.fn().mockResolvedValue({ id: 'block_1', blockerUserId: customer.id, blockedUserId: reported.id, createdAt: now, blocked: reported }), deleteBlock: jest.fn().mockResolvedValue({ count: 1 }), findBlocksAndCount: jest.fn().mockResolvedValue([[{ id: 'block_1', blockerUserId: customer.id, blockedUserId: reported.id, createdAt: now, blocked: reported }], 1]), findBlockBetween: jest.fn().mockResolvedValue(overrides.block ?? null) };
  return { service: new UserSafetyService(reports as unknown as UserSafetyRepository, blocks as unknown as BlockedUsersRepository), reports, blocks };
}

describe('UserSafetyService', () => {
  it('reports user, validates evidence, notifies admins, and optionally blocks', async () => {
    const { service, reports, blocks } = createCustomerService();
    const result = await service.reportUser({ uid: customer.id, role: UserRole.REGISTERED_USER }, reported.id, { reason: UserSafetyReportReason.HARASSMENT, details: 'bad message', sourceType: UserSafetySourceType.CHAT, sourceId: 'thread_1', evidenceUrls: ['https://cdn/user-report-evidence/a.png'], blockUser: true });
    expect(result.message).toBe('User report submitted successfully.');
    expect(reports.createReport).toHaveBeenCalledWith(expect.objectContaining({ reporterUserId: customer.id, reportedUserId: reported.id, reason: UserSafetyReportReason.HARASSMENT }));
    expect(blocks.upsertBlock).toHaveBeenCalledWith(customer.id, reported.id);
    expect(reports.createManyNotifications).toHaveBeenCalled();
  });

  it('blocks duplicate active reports and self reports/blocks', async () => {
    await expect(createCustomerService({ duplicate: report }).service.reportUser({ uid: customer.id, role: UserRole.REGISTERED_USER }, reported.id, { reason: UserSafetyReportReason.HARASSMENT, details: 'bad', sourceType: UserSafetySourceType.CHAT })).rejects.toBeInstanceOf(ConflictException);
    await expect(createCustomerService().service.blockUser({ uid: customer.id, role: UserRole.REGISTERED_USER }, customer.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks and unblocks users and enforces blocked chat interactions', async () => {
    const { service } = createCustomerService({ block: { id: 'block_1' } });
    await expect(service.blockUser({ uid: customer.id, role: UserRole.REGISTERED_USER }, reported.id)).resolves.toEqual(expect.objectContaining({ data: { blockedUserId: reported.id, blockedAt: now } }));
    await expect(service.unblockUser({ uid: customer.id, role: UserRole.REGISTERED_USER }, reported.id)).resolves.toEqual({ data: null, message: 'User unblocked successfully.' });
    await expect(service.assertUsersCanInteract(customer.id, reported.id)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('UserSafetyAdminService', () => {
  it('lists reports and performs warn/suspend/dismiss actions with audit and notifications', async () => {
    const repository: Record<string, jest.Mock> = { findReportsAndCount: jest.fn().mockResolvedValue([[report], 1]), findReport: jest.fn().mockResolvedValue({ ...report, logs: [] }), statusFor: jest.fn((action: UserSafetyAdminAction) => action === UserSafetyAdminAction.SUSPEND_REPORTED_USER ? UserSafetyReportStatus.SUSPENDED : action === UserSafetyAdminAction.DISMISS_REPORT ? UserSafetyReportStatus.DISMISSED : UserSafetyReportStatus.WARNED), updateReport: jest.fn().mockResolvedValue({ ...report, status: UserSafetyReportStatus.WARNED }), createLog: jest.fn().mockResolvedValue({}), createSuspension: jest.fn().mockResolvedValue({}), createNotification: jest.fn().mockResolvedValue({}), findReportsForExport: jest.fn().mockResolvedValue([report]) };
    repository.runAction = jest.fn((fn: (tx: unknown) => unknown) => fn(repository));
    const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
    const service = new UserSafetyAdminService(repository as unknown as UserSafetyAdminRepository, auditLog as never);
    await expect(service.reports({})).resolves.toEqual(expect.objectContaining({ meta: expect.objectContaining({ total: 1 }) }));
    await service.action({ uid: 'admin_1', role: UserRole.STAFF }, report.id, { action: UserSafetyAdminAction.WARN_REPORTED_USER, reason: 'HARASSMENT_CONFIRMED', notifyReporter: true, notifyReportedUser: true });
    expect(repository.createLog).toHaveBeenCalled();
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_SAFETY_WARN_REPORTED_USER' }));
    expect(repository.createNotification).toHaveBeenCalledTimes(2);
  });
});
