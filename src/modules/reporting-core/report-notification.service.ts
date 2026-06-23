import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma } from '@prisma/client';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';
import { ReportNotificationInput } from './reporting-core.types';

@Injectable()
export class ReportNotificationService {
  constructor(private readonly notificationDispatch: NotificationDispatchService) {}

  notify(input: ReportNotificationInput) {
    return this.notificationDispatch.createAndEmit({
      recipientId: input.recipientId,
      recipientType: input.recipientType as NotificationRecipientType,
      title: input.title,
      message: input.message,
      type: input.type,
      metadataJson: (input.metadata ?? {}) as Prisma.InputJsonObject,
      idempotencyKey: input.idempotencyKey,
    });
  }

  notifyMany(inputs: ReportNotificationInput[]) {
    return Promise.all(inputs.map((input) => this.notify(input)));
  }
}
