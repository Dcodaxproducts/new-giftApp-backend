import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StorageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUploadAccount(id: string | undefined) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, deletedAt: true } });
  }

  findUploadOwner(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
  }

  findGiftForUpload(giftId: string) {
    return this.prisma.gift.findFirst({ where: { id: giftId, deletedAt: null }, select: { id: true, providerId: true } });
  }
}
