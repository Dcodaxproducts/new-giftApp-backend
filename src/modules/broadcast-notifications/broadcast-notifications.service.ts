import { ForbiddenException, Injectable } from '@nestjs/common';
import { BroadcastAudience, BroadcastStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { BroadcastAudienceDto, CreateBroadcastDto } from './dto/broadcast-notifications.dto';
import { BroadcastNotificationsRepository } from './repositories/broadcast-notifications.repository';

@Injectable()
export class BroadcastNotificationsService {
  constructor(
    private readonly broadcastNotificationsRepository: BroadcastNotificationsRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async create(user: AuthUserContext, dto: CreateBroadcastDto) {
    this.assertCreatePermission(user);
    const broadcast = await this.broadcastNotificationsRepository.createBroadcast({
      title: dto.title.trim(),
      message: dto.message.trim(),
      audience: this.toAudience(dto.audience),
      status: BroadcastStatus.SENT,
      createdBy: user.uid,
    });
    await this.auditLog.write({
      actorId: user.uid,
      actorType: user.role,
      targetId: broadcast.id,
      targetType: 'BROADCAST',
      action: 'BROADCAST_CREATED',
      beforeJson: undefined,
      afterJson: this.toDetail(broadcast),
    });
    return { data: this.toDetail(broadcast), message: 'Broadcast created successfully.' };
  }

  private toAudience(audience: BroadcastAudienceDto): BroadcastAudience {
    if (audience === BroadcastAudienceDto.PROVIDER) return BroadcastAudience.PROVIDER;
    if (audience === BroadcastAudienceDto.USER) return BroadcastAudience.USER;
    return BroadcastAudience.ALL_USERS;
  }

  private toDetail(broadcast: { id: string; title: string; message: string; audience: BroadcastAudience; status: BroadcastStatus; createdAt: Date }) {
    return {
      id: broadcast.id,
      title: broadcast.title,
      message: broadcast.message,
      audience: broadcast.audience,
      status: broadcast.status,
      createdAt: broadcast.createdAt,
    };
  }

  private assertCreatePermission(user: AuthUserContext): void {
    if (user.role === UserRole.SUPER_ADMIN || this.hasPermission(user, 'broadcasts.create')) return;
    throw new ForbiddenException('Your role does not have the required broadcast permission');
  }

  private hasPermission(user: AuthUserContext, permission: string): boolean {
    if (!user.permissions || typeof user.permissions !== 'object' || Array.isArray(user.permissions)) return false;
    const [module, key] = permission.split('.');
    const values = (user.permissions as Record<string, unknown>)[module];
    return Array.isArray(values) && values.includes(key);
  }
}
