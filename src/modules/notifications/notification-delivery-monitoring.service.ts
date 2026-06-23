import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationDeliveryStatus, Prisma } from '@prisma/client';
import { NotificationDeliveryLogRepository } from './repositories/notification-delivery-log.repository';
import { ListNotificationDeliveryLogsDto } from './dto/notification-delivery.dto';
import { NotificationDispatchService } from './notification-dispatch.service';
import { getPagination } from '../../common/pagination/pagination.util';

@Injectable()
export class NotificationDeliveryMonitoringService {
  constructor(
    private readonly logs: NotificationDeliveryLogRepository,
    private readonly dispatcher: NotificationDispatchService,
  ) {}

  async stats() {
    return { data: await this.logs.stats(), message: 'Notification delivery stats fetched successfully.' };
  }

  async logsList(query: ListNotificationDeliveryLogsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.NotificationDeliveryLogWhereInput = {
      recipientId: query.recipientId,
      recipientType: query.recipientType,
      notificationType: query.notificationType,
    };
    if (query.status) where.OR = [{ inAppStatus: query.status }, { socketStatus: query.status }, { pushStatus: query.status }, { emailStatus: query.status }];
    const [rows, total] = await this.logs.findLogsAndCount({ where, skip, take });
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Notification delivery logs fetched successfully.' };
  }

  async detail(id: string) {
    const log = await this.logs.findById(id);
    if (!log) throw new NotFoundException('Notification delivery log not found');
    return { data: log, message: 'Notification delivery log fetched successfully.' };
  }

  async retry(id: string) {
    const log = await this.logs.findById(id);
    if (!log) throw new NotFoundException('Notification delivery log not found');
    await this.logs.update(id, { socketStatus: NotificationDeliveryStatus.RETRIED, pushStatus: NotificationDeliveryStatus.RETRIED, emailStatus: NotificationDeliveryStatus.RETRIED, retryCount: { increment: 1 }, lastError: null });
    const retried = await this.dispatcher.retryDelivery(log);
    return { data: retried, message: 'Notification delivery retry queued successfully.' };
  }
}
