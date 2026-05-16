import { Injectable } from '@nestjs/common';
import { CustomerEventReminderJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CustomerEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyWithCount(params: { where: Prisma.CustomerEventWhereInput; include: Prisma.CustomerEventInclude; orderBy: Prisma.CustomerEventOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.customerEvent.findMany(params),
      this.prisma.customerEvent.count({ where: params.where }),
    ]);
  }

  findCalendarEvents(params: { where: Prisma.CustomerEventWhereInput; include: Prisma.CustomerEventInclude }) {
    return this.prisma.customerEvent.findMany({ where: params.where, include: params.include, orderBy: { eventDate: 'asc' } });
  }

  findUpcomingEvents(params: { where: Prisma.CustomerEventWhereInput; include: Prisma.CustomerEventInclude; take: number }) {
    return this.prisma.customerEvent.findMany({ where: params.where, include: params.include, orderBy: { eventDate: 'asc' }, take: params.take });
  }

  createWithRecipient(data: Prisma.CustomerEventUncheckedCreateInput, include: Prisma.CustomerEventInclude) {
    return this.prisma.customerEvent.create({ data, include });
  }

  findOwnedByUser(userId: string, id: string, include: Prisma.CustomerEventInclude) {
    return this.prisma.customerEvent.findFirst({ where: { id, userId, deletedAt: null }, include });
  }

  updateWithRecipient(id: string, data: Prisma.CustomerEventUncheckedUpdateInput, include: Prisma.CustomerEventInclude) {
    return this.prisma.customerEvent.update({ where: { id }, data, include });
  }

  delete(id: string) {
    return this.prisma.customerEvent.delete({ where: { id } });
  }

  findOwnedContact(userId: string, id: string) {
    return this.prisma.customerContact.findFirst({ where: { id, userId, deletedAt: null } });
  }

  cancelPendingReminderJobs(eventId: string) {
    return this.prisma.customerEventReminderJob.updateMany({ where: { eventId, status: CustomerEventReminderJobStatus.PENDING }, data: { status: CustomerEventReminderJobStatus.CANCELLED } });
  }
}
