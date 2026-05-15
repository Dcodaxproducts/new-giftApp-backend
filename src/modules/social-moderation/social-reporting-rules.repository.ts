import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type RuleCreateData = Prisma.Args<PrismaService['socialReportingRule'], 'create'>['data'];
type RuleUpdateData = Prisma.Args<PrismaService['socialReportingRule'], 'update'>['data'];

@Injectable()
export class SocialReportingRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRuleStatsRows(params: { dayStart: Date; monthStart: Date; weekAgo: Date }) {
    return this.prisma.$transaction([
      this.prisma.socialReportingRule.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.socialReportingRule.count({ where: { createdAt: { gte: params.monthStart }, deletedAt: null } }),
      this.prisma.socialReport.count({ where: { createdAt: { gte: params.dayStart } } }),
      this.prisma.socialModerationLog.findMany({ where: { createdAt: { gte: params.weekAgo } }, include: { report: { select: { createdAt: true } } }, take: 1000 }),
    ]);
  }

  findRulesAndCount(params: { where: Prisma.SocialReportingRuleWhereInput; orderBy: Prisma.SocialReportingRuleOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.socialReportingRule.findMany({ where: params.where, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.socialReportingRule.count({ where: params.where }),
    ]);
  }

  createRule(data: RuleCreateData) { return this.prisma.socialReportingRule.create({ data }); }
  findRuleById(id: string) { return this.prisma.socialReportingRule.findFirst({ where: { id, deletedAt: null } }); }
  updateRule(id: string, data: RuleUpdateData) { return this.prisma.socialReportingRule.update({ where: { id }, data }); }
  softDeleteRule(id: string) { return this.prisma.socialReportingRule.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }); }
  updateRuleStatus(id: string, isActive: boolean) { return this.prisma.socialReportingRule.update({ where: { id }, data: { isActive } }); }
  findRulesForExport(isActive?: boolean) { return this.prisma.socialReportingRule.findMany({ where: { deletedAt: null, isActive }, orderBy: { updatedAt: 'desc' }, take: 10000 }); }
}
