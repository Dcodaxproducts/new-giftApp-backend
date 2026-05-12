import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { MediaUploadPolicyService } from '../media-upload-policy/media-upload-policy.service';
import { UploadFolder, CreatePresignedUploadDto } from './dto/create-presigned-upload.dto';
import { StorageService } from './storage.service';

type Ownership = { ownerId: string; targetAccountId: string | null; effectiveAccountId: string; giftId: string | null };
type OwnershipResolver = { resolveUploadOwnership(user: AuthUserContext, dto: CreatePresignedUploadDto): Promise<Ownership> };

describe('Storage upload ownership rules', () => {
  const userFindUnique = jest.fn();
  const giftFindFirst = jest.fn();
  let service: OwnershipResolver;

  beforeEach(() => {
    userFindUnique.mockReset();
    giftFindFirst.mockReset();
    const prisma = { user: { findUnique: userFindUnique }, gift: { findFirst: giftFindFirst } } as unknown as PrismaService;
    const mediaPolicy = { assertUploadAllowed: jest.fn() } as unknown as MediaUploadPolicyService;
    service = new StorageService({} as never, { write: jest.fn() } as never, prisma, mediaPolicy) as unknown as OwnershipResolver;
    userFindUnique.mockImplementation(({ where }: { where: { id: string } }) => Promise.resolve({ id: where.id, role: roleFor(where.id), deletedAt: null }));
    giftFindFirst.mockResolvedValue({ id: 'gift_1', providerId: 'provider_1' });
  });

  it('derives REGISTERED_USER ownerId from JWT and rejects targetAccountId', async () => {
    await expect(resolve(user('customer_1', UserRole.REGISTERED_USER), { folder: UploadFolder.USER_AVATARS, targetAccountId: 'customer_2' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(resolve(user('customer_1', UserRole.REGISTERED_USER), { folder: UploadFolder.USER_AVATARS })).resolves.toMatchObject({ ownerId: 'customer_1', targetAccountId: null, effectiveAccountId: 'customer_1' });
  });

  it('derives PROVIDER ownerId from JWT and rejects targetAccountId', async () => {
    await expect(resolve(user('provider_1', UserRole.PROVIDER), { folder: UploadFolder.PROVIDER_AVATARS })).resolves.toMatchObject({ ownerId: 'provider_1', targetAccountId: null, effectiveAccountId: 'provider_1' });
    await expect(resolve(user('provider_1', UserRole.PROVIDER), { folder: UploadFolder.PROVIDER_LOGOS, targetAccountId: 'provider_2' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('derives ADMIN ownerId by default and allows targetAccountId only with permission', async () => {
    await expect(resolve(user('admin_1', UserRole.ADMIN), { folder: UploadFolder.ADMIN_AVATARS })).resolves.toMatchObject({ ownerId: 'admin_1', targetAccountId: null });
    await expect(resolve(user('admin_1', UserRole.ADMIN), { folder: UploadFolder.PROVIDER_LOGOS, targetAccountId: 'provider_1' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(resolve(user('admin_1', UserRole.ADMIN, { providers: ['update'] }), { folder: UploadFolder.PROVIDER_LOGOS, targetAccountId: 'provider_1' })).resolves.toMatchObject({ ownerId: 'admin_1', targetAccountId: 'provider_1', effectiveAccountId: 'provider_1' });
  });

  it('allows SUPER_ADMIN valid targetAccountId and rejects missing or mismatched targets', async () => {
    await expect(resolve(user('super_1', UserRole.SUPER_ADMIN), { folder: UploadFolder.PROVIDER_LOGOS, targetAccountId: 'provider_1' })).resolves.toMatchObject({ ownerId: 'super_1', targetAccountId: 'provider_1' });
    userFindUnique.mockResolvedValueOnce({ id: 'super_1', role: UserRole.SUPER_ADMIN, deletedAt: null }).mockResolvedValueOnce(null);
    await expect(resolve(user('super_1', UserRole.SUPER_ADMIN), { folder: UploadFolder.PROVIDER_LOGOS, targetAccountId: 'missing_1' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(resolve(user('super_1', UserRole.SUPER_ADMIN), { folder: UploadFolder.PROVIDER_LOGOS, targetAccountId: 'customer_1' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts giftId only for gift-images and blocks provider uploads for other providers gifts', async () => {
    await expect(resolve(user('provider_1', UserRole.PROVIDER), { folder: UploadFolder.PROVIDER_LOGOS, giftId: 'gift_1' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(resolve(user('provider_1', UserRole.PROVIDER), { folder: UploadFolder.GIFT_IMAGES, giftId: 'gift_1' })).resolves.toMatchObject({ giftId: 'gift_1' });
    giftFindFirst.mockResolvedValueOnce({ id: 'gift_2', providerId: 'provider_2' });
    await expect(resolve(user('provider_1', UserRole.PROVIDER), { folder: UploadFolder.GIFT_IMAGES, giftId: 'gift_2' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows gift-message-media only for REGISTERED_USER and prevents cross-user access in storage queries', async () => {
    await expect(resolve(user('customer_1', UserRole.REGISTERED_USER), { folder: UploadFolder.GIFT_MESSAGE_MEDIA })).resolves.toMatchObject({ ownerId: 'customer_1' });
    await expect(resolve(user('provider_1', UserRole.PROVIDER), { folder: UploadFolder.GIFT_MESSAGE_MEDIA })).rejects.toBeInstanceOf(ForbiddenException);
  });

  function resolve(userContext: AuthUserContext, partial: Partial<CreatePresignedUploadDto>) {
    return service.resolveUploadOwnership(userContext, dto(partial));
  }

  function dto(partial: Partial<CreatePresignedUploadDto>): CreatePresignedUploadDto {
    return { folder: UploadFolder.USER_AVATARS, fileName: 'file.png', contentType: 'image/png', sizeBytes: 1024, ...partial };
  }

  function user(uid: string, role: UserRole, permissions?: AuthUserContext['permissions']): AuthUserContext {
    return { uid, role, permissions };
  }

  function roleFor(id: string): UserRole {
    if (id.startsWith('provider')) return UserRole.PROVIDER;
    if (id.startsWith('admin')) return UserRole.ADMIN;
    if (id.startsWith('super')) return UserRole.SUPER_ADMIN;
    return UserRole.REGISTERED_USER;
  }
});
