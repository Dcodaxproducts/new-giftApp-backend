import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CustomerContactsService } from './customer-contacts.service';

const now = new Date('2026-05-08T10:00:00.000Z');
const contact = {
  id: 'contact_1',
  userId: 'user_1',
  name: 'Alex Anderson',
  relationship: 'Brother',
  phone: '+15550123456',
  email: null,
  address: '387 Merdina',
  likes: 'Watches, perfumes, sneakers',
  avatarUrl: 'https://cdn.yourdomain.com/customer-contact-avatars/alex.png',
  birthday: new Date('1990-05-12'),
  notes: 'Prefers elegant gifts.',
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

function createService(foundContact: typeof contact | null = contact) {
  const prisma = {
    customerContact: {
      create: jest.fn().mockResolvedValue(contact),
      findMany: jest.fn().mockResolvedValue([contact]),
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(foundContact),
      update: jest.fn().mockResolvedValue(contact),
    },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const service = new CustomerContactsService(prisma as unknown as ConstructorParameters<typeof CustomerContactsService>[0]);
  return { service, prisma };
}

const user = { uid: 'user_1', role: UserRole.REGISTERED_USER };
type ContactWriteCall = [{ where?: { id?: string }; data?: Record<string, unknown> }];
type ContactFindCall = [{ where?: Record<string, unknown> }];

describe('CustomerContactsService', () => {
  it('registered user can create contact', async () => {
    const { service, prisma } = createService();

    const result = await service.create(user, { name: 'Mary Wilson', phone: '+1 (234) 567-890', relationship: 'Mother' });

    const calls = prisma.customerContact.create.mock.calls as ContactWriteCall[];
    expect(calls[0][0].data?.userId).toBe('user_1');
    expect(calls[0][0].data?.phone).toBe('+1234567890');
    expect(result.message).toBe('Contact created successfully');
  });

  it('registered user can list only own contacts', async () => {
    const { service, prisma } = createService();

    await service.list(user, { page: 1, limit: 20 });

    const calls = prisma.customerContact.findMany.mock.calls as ContactFindCall[];
    expect(calls[0][0].where?.userId).toBe('user_1');
    expect(calls[0][0].where?.deletedAt).toBeNull();
  });

  it('registered user can get own contact', async () => {
    const { service } = createService();

    const result = await service.details(user, 'contact_1');

    expect(result.data.id).toBe('contact_1');
    expect(result.message).toBe('Contact fetched successfully');
  });

  it('registered user cannot get another user contact', async () => {
    const { service } = createService(null);

    await expect(service.details(user, 'other_contact')).rejects.toThrow(NotFoundException);
  });

  it('registered user can update own contact', async () => {
    const { service, prisma } = createService();

    const result = await service.update(user, 'contact_1', { email: 'alex@example.com' });

    const calls = prisma.customerContact.update.mock.calls as ContactWriteCall[];
    expect(calls[0][0].where?.id).toBe('contact_1');
    expect(calls[0][0].data?.email).toBe('alex@example.com');
    expect(result.message).toBe('Contact updated successfully');
  });

  it('registered user cannot update another user contact', async () => {
    const { service } = createService(null);

    await expect(service.update(user, 'other_contact', { name: 'Other' })).rejects.toThrow(NotFoundException);
  });

  it('registered user can delete own contact', async () => {
    const { service, prisma } = createService();

    const result = await service.delete(user, 'contact_1');

    const calls = prisma.customerContact.update.mock.calls as ContactWriteCall[];
    expect(calls[0][0].where?.id).toBe('contact_1');
    expect(calls[0][0].data?.deletedAt).toBeInstanceOf(Date);
    expect(result.message).toBe('Contact deleted successfully.');
  });

  it('searches contacts by name phone email and relationship', async () => {
    const { service, prisma } = createService();

    await service.list(user, { search: 'alex' });

    const calls = prisma.customerContact.findMany.mock.calls as ContactFindCall[];
    expect(calls[0][0].where?.OR).toEqual(expect.arrayContaining([
      { name: { contains: 'alex', mode: 'insensitive' } },
      { phone: { contains: 'alex', mode: 'insensitive' } },
      { email: { contains: 'alex', mode: 'insensitive' } },
      { relationship: { contains: 'alex', mode: 'insensitive' } },
    ]));
  });
});
