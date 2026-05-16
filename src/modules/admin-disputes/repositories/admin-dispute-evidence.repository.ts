import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminDisputeEvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEvidence(disputeId: string) {
    return this.prisma.disputeEvidence.findMany({ where: { disputeId }, orderBy: { createdAt: 'asc' } });
  }
}
