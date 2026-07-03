import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

type RuleCreateData = Prisma.Args<PrismaService['socialReportingRule'], 'create'>['data'];
type RuleUpdateData = Prisma.Args<PrismaService['socialReportingRule'], 'update'>['data'];

@Injectable()
export class SocialReportingRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRuleStatsRows(params: { dayStart: Date; monthStart: Date; weekAgo: Date }) {
    return Promise.all([
      this.prisma.socialReportingRule.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.socialReportingRule.count({ where: { createdAt: { gte: params.monthStart }, deletedAt: null } }),
      this.prisma.socialReport.count({ where: { createdAt: { gte: params.dayStart } } }),
      Promise.resolve([] as Array<{ createdAt: Date; report: { createdAt: Date } }>),
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
  deleteRule(id: string) { return this.prisma.socialReportingRule.delete({ where: { id } }); }
  findRulesForExport(isActive?: boolean) { return this.prisma.socialReportingRule.findMany({ where: { deletedAt: null, isActive }, orderBy: { createdAt: 'desc' }, take: 10000 }); }
}
