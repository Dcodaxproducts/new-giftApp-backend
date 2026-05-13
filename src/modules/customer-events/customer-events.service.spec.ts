import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerEventReminderFrequency, CustomerEventReminderJobStatus, CustomerEventReminderTiming, CustomerEventType, UserRole } from '@prisma/client';
import { CustomerEventsService } from './customer-events.service';
import { ReminderChannelDto } from './dto/customer-events.dto';

const now = new Date('2026-01-01T00:00:00.000Z');
const recipient = { id: 'contact_1', name: 'Sarah', relationship: 'Friend', phone: '+15550123456', email: 'sarah@example.com', avatarUrl: null };
const event = { id: 'event_1', userId: 'user_1', recipientId: 'contact_1', eventType: CustomerEventType.BIRTHDAY, title: "Sarah's Birthday", eventDate: new Date('2026-01-31T00:00:00.000Z'), reminderTiming: CustomerEventReminderTiming.ON_THE_DAY, reminderFrequency: CustomerEventReminderFrequency.ONE_TIME, customAlertTime: '09:00', channelsJson: ['EMAIL', 'SMS'], notes: 'Send gift', isActive: true, lastReminderSentAt: null, nextReminderAt: now, createdAt: now, updatedAt: now, deletedAt: null, recipient };
const user = { uid: 'user_1', role: UserRole.REGISTERED_USER };
type FindCall = [{ where?: Record<string, unknown>; take?: number }];
type UpdateManyCall = [{ data?: Record<string, unknown> }];

function createService(foundEvent: typeof event | null = event, contact: typeof recipient | null = recipient) {
  const prisma = {
    customerEvent: { findMany: jest.fn().mockResolvedValue([event]), count: jest.fn().mockResolvedValue(1), create: jest.fn().mockResolvedValue(event), findFirst: jest.fn().mockResolvedValue(foundEvent), update: jest.fn().mockResolvedValue(event), delete: jest.fn().mockResolvedValue(event) },
    customerContact: { findFirst: jest.fn().mockResolvedValue(contact) },
    customerEventReminderJob: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  return { service: new CustomerEventsService(prisma as unknown as ConstructorParameters<typeof CustomerEventsService>[0]), prisma };
}

describe('CustomerEventsService', () => {
  it('registered user can create event', async () => {
    const { service, prisma } = createService();
    const result = await service.create(user, { eventType: CustomerEventType.BIRTHDAY, title: "Sarah's Birthday", recipientId: 'contact_1', eventDate: '2026-01-31T00:00:00.000Z', channels: [ReminderChannelDto.EMAIL, ReminderChannelDto.SMS] });
    expect(prisma.customerEvent.create).toHaveBeenCalled();
    expect(result.message).toBe('Event created successfully');
  });
  it('registered user can list only own events', async () => {
    const { service, prisma } = createService();
    await service.list(user, {});
    const calls = prisma.customerEvent.findMany.mock.calls as FindCall[];
    expect(calls[0][0].where?.userId).toBe('user_1');
  });
  it('calendar returns marked dates', async () => {
    const { service } = createService();
    const result = await service.calendar(user, { month: 1, year: 2026 });
    expect(result.data.markedDates[0]).toEqual(expect.objectContaining({ date: '2026-01-31', eventCount: 1 }));
  });
  it('upcoming returns events within daysAhead', async () => {
    const { service, prisma } = createService();
    await service.upcoming(user, { daysAhead: 30, limit: 10 });
    const calls = prisma.customerEvent.findMany.mock.calls as FindCall[];
    expect(calls[0][0].take).toBe(10);
  });
  it('user cannot access another user event', async () => {
    const { service } = createService(null);
    await expect(service.details(user, 'other')).rejects.toThrow(NotFoundException);
  });
  it('user can update own event', async () => {
    const { service, prisma } = createService();
    const result = await service.update(user, 'event_1', { title: "Sarah's Anniversary" });
    expect(prisma.customerEvent.update).toHaveBeenCalled();
    expect(result.message).toBe('Event updated successfully');
  });
  it('user can delete own event and cancels pending jobs', async () => {
    const { service, prisma } = createService();
    const result = await service.delete(user, 'event_1');
    const calls = prisma.customerEventReminderJob.updateMany.mock.calls as UpdateManyCall[];
    expect(calls[0][0].data?.status).toBe(CustomerEventReminderJobStatus.CANCELLED);
    expect(result.message).toBe('Event deleted successfully.');
  });
  it('recipientId must belong to same user', async () => {
    const { service } = createService(event, null);
    await expect(service.create(user, { eventType: CustomerEventType.BIRTHDAY, title: 'Bad', recipientId: 'other_contact', eventDate: '2026-01-31T00:00:00.000Z' })).rejects.toThrow(BadRequestException);
  });
  it('reminder settings can be updated', async () => {
    const { service } = createService();
    const result = await service.updateReminderSettings(user, 'event_1', { reminderTiming: CustomerEventReminderTiming.ON_THE_DAY, channels: { push: false, email: true, sms: true } });
    expect(result.message).toBe('Reminder settings updated successfully');
  });
});
