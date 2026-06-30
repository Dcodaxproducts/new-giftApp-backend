import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SeasonalThemesService } from './seasonal-themes.service';

const now = new Date('2026-06-30T09:00:00.000Z');
const theme = {
  id: 'theme_1',
  name: 'Eid 2026',
  imageUrl: 'https://cdn.example.com/seasonal-theme-assets/admin_1/eid.png',
  startsAt: new Date('2026-03-15T00:00:00.000Z'),
  endsAt: new Date('2026-03-25T23:59:59.000Z'),
  isActive: true,
  createdAt: now,
  updatedAt: now,
};
const user = { uid: 'admin_1', role: UserRole.ADMIN };

function createService(overrides: Record<string, unknown> = {}) {
  const repository = {
    findManyAndCount: jest.fn().mockResolvedValue([[theme], 1]),
    findById: jest.fn().mockResolvedValue(theme),
    findActiveAt: jest.fn().mockResolvedValue(theme),
    findOverlappingActive: jest.fn().mockResolvedValue(null),
    findCompletedThemeAssetByUrl: jest.fn().mockResolvedValue({ id: 'upload_1', fileUrl: theme.imageUrl }),
    create: jest.fn().mockImplementation((data) => Promise.resolve({ ...theme, ...data })),
    update: jest.fn().mockImplementation((_id, data) => Promise.resolve({ ...theme, ...data })),
    delete: jest.fn().mockResolvedValue(theme),
    ...overrides,
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  return { service: new SeasonalThemesService(repository as never, auditLog as never), repository, auditLog };
}

describe('SeasonalThemesService', () => {
  it('creates a theme from a completed seasonal-theme-assets upload', async () => {
    const { service, repository, auditLog } = createService();
    const response = await service.create(user, {
      name: ' Eid 2026 ',
      imageUrl: theme.imageUrl,
      startsAt: theme.startsAt.toISOString(),
      endsAt: theme.endsAt.toISOString(),
      isActive: true,
    });

    expect(repository.findCompletedThemeAssetByUrl).toHaveBeenCalledWith(theme.imageUrl);
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Eid 2026', imageUrl: theme.imageUrl, isActive: true }));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SEASONAL_THEME_CREATED', targetType: 'SEASONAL_THEME' }));
    expect(response.message).toBe('Seasonal theme created successfully.');
  });

  it('accepts signed completed upload URLs and stores the stable URL', async () => {
    const { service, repository } = createService();
    await service.create(user, {
      name: 'Eid 2026',
      imageUrl: `${theme.imageUrl}?X-Amz-Signature=signed`,
      startsAt: theme.startsAt.toISOString(),
      endsAt: theme.endsAt.toISOString(),
      isActive: true,
    });

    expect(repository.findCompletedThemeAssetByUrl).toHaveBeenCalledWith(`${theme.imageUrl}?X-Amz-Signature=signed`);
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: theme.imageUrl }));
  });

  it('rejects image URLs that are not completed theme uploads', async () => {
    const { service } = createService({ findCompletedThemeAssetByUrl: jest.fn().mockResolvedValue(null) });

    await expect(service.create(user, {
      name: 'Eid 2026',
      imageUrl: theme.imageUrl,
      startsAt: theme.startsAt.toISOString(),
      endsAt: theme.endsAt.toISOString(),
      isActive: true,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects overlapping active date ranges', async () => {
    const { service } = createService({ findOverlappingActive: jest.fn().mockResolvedValue({ id: 'theme_existing' }) });

    await expect(service.create(user, {
      name: 'Eid 2026',
      imageUrl: theme.imageUrl,
      startsAt: theme.startsAt.toISOString(),
      endsAt: theme.endsAt.toISOString(),
      isActive: true,
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the current active theme', async () => {
    const { service } = createService();
    await expect(service.active()).resolves.toMatchObject({ data: { id: 'theme_1', imageUrl: theme.imageUrl }, message: 'Active seasonal theme fetched successfully.' });
  });
});
