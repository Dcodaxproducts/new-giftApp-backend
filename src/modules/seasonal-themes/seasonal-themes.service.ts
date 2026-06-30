import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SeasonalTheme } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { getPagination } from '../../common/pagination/pagination.util';
import { CreateSeasonalThemeDto, ListSeasonalThemesDto, UpdateSeasonalThemeDto } from './dto/seasonal-themes.dto';
import { SeasonalThemesRepository } from './seasonal-themes.repository';

@Injectable()
export class SeasonalThemesService {
  constructor(private readonly repository: SeasonalThemesRepository, private readonly auditLog: AuditLogWriterService) {}

  async list(query: ListSeasonalThemesDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.SeasonalThemeWhereInput = { isActive: query.isActive };
    const [items, total] = await this.repository.findManyAndCount({ where, skip, take });
    return { data: items.map((item) => this.toView(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Seasonal themes fetched successfully.' };
  }

  async active() {
    const theme = await this.repository.findActiveAt(new Date());
    return { data: theme ? this.toView(theme) : null, message: theme ? 'Active seasonal theme fetched successfully.' : 'No active seasonal theme found.' };
  }

  async details(id: string) {
    const theme = await this.getTheme(id);
    return { data: this.toView(theme), message: 'Seasonal theme fetched successfully.' };
  }

  async create(user: AuthUserContext, dto: CreateSeasonalThemeDto, ipAddress?: string) {
    const startsAt = this.date(dto.startsAt);
    const endsAt = this.date(dto.endsAt);
    this.assertDateRange(startsAt, endsAt);
    await this.assertThemeAsset(dto.imageUrl);
    if (dto.isActive ?? true) await this.assertNoOverlap(startsAt, endsAt);

    const created = await this.repository.create({ name: dto.name.trim(), imageUrl: this.normalizeUploadUrl(dto.imageUrl), startsAt, endsAt, isActive: dto.isActive ?? true });
    await this.writeAudit(user, created.id, 'SEASONAL_THEME_CREATED', null, this.toAuditView(created), ipAddress);
    return { data: this.toView(created), message: 'Seasonal theme created successfully.' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateSeasonalThemeDto, ipAddress?: string) {
    const current = await this.getTheme(id);
    const startsAt = dto.startsAt ? this.date(dto.startsAt) : current.startsAt;
    const endsAt = dto.endsAt ? this.date(dto.endsAt) : current.endsAt;
    const isActive = dto.isActive ?? current.isActive;
    this.assertDateRange(startsAt, endsAt);
    if (dto.imageUrl) await this.assertThemeAsset(dto.imageUrl);
    if (isActive) await this.assertNoOverlap(startsAt, endsAt, id);

    const before = this.toAuditView(current);
    const updated = await this.repository.update(id, {
      name: dto.name?.trim(),
      imageUrl: dto.imageUrl ? this.normalizeUploadUrl(dto.imageUrl) : undefined,
      startsAt,
      endsAt,
      isActive,
    });
    await this.writeAudit(user, id, 'SEASONAL_THEME_UPDATED', before, this.toAuditView(updated), ipAddress);
    return { data: this.toView(updated), message: 'Seasonal theme updated successfully.' };
  }

  async delete(user: AuthUserContext, id: string, ipAddress?: string) {
    const current = await this.getTheme(id);
    const deleted = await this.repository.delete(id);
    await this.writeAudit(user, id, 'SEASONAL_THEME_DELETED', this.toAuditView(current), null, ipAddress);
    return { data: { id: deleted.id, deleted: true }, message: 'Seasonal theme deleted successfully.' };
  }

  private async getTheme(id: string): Promise<SeasonalTheme> {
    const theme = await this.repository.findById(id);
    if (!theme) throw new NotFoundException('Seasonal theme not found');
    return theme;
  }

  private async assertThemeAsset(imageUrl: string): Promise<void> {
    const upload = await this.repository.findCompletedThemeAssetByUrl(imageUrl);
    if (!upload) throw new BadRequestException('imageUrl must use a completed seasonal-theme-assets upload.');
  }

  private normalizeUploadUrl(imageUrl: string): string {
    return imageUrl.split('?')[0];
  }

  private async assertNoOverlap(startsAt: Date, endsAt: Date, excludeId?: string): Promise<void> {
    const existing = await this.repository.findOverlappingActive({ startsAt, endsAt, excludeId });
    if (existing) throw new ConflictException('Another seasonal theme is already active for this date range.');
  }

  private assertDateRange(startsAt: Date, endsAt: Date): void {
    if (startsAt.getTime() >= endsAt.getTime()) throw new BadRequestException('startsAt must be before endsAt.');
  }

  private date(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException('Invalid date value.');
    return parsed;
  }

  private toView(theme: SeasonalTheme) {
    return { id: theme.id, name: theme.name, imageUrl: theme.imageUrl, startsAt: theme.startsAt, endsAt: theme.endsAt, isActive: theme.isActive, createdAt: theme.createdAt, updatedAt: theme.updatedAt };
  }

  private toAuditView(theme: SeasonalTheme) {
    return this.toView(theme);
  }

  private async writeAudit(user: AuthUserContext, targetId: string, action: string, beforeJson: unknown, afterJson: unknown, ipAddress?: string) {
    await this.auditLog.write({ actorId: user.uid, targetId, targetType: 'SEASONAL_THEME', action, module: 'Seasonal Themes', beforeJson, afterJson, ipAddress });
  }
}
