import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogWriterRepository {
  constructor(private readonly prisma: PrismaService) {}

  createAdminAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    return this.prisma.adminAuditLog.create({ data });
  }
}
