import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
@Injectable()
export class GuestAccessSettingsRepository { constructor(private readonly prisma: PrismaService) {} findFirst(){return this.prisma.guestAccessSettings.findFirst({orderBy:{createdAt:'asc'}});} createDefault(){return this.prisma.guestAccessSettings.create({data:{}});} update(id:string,data:Prisma.GuestAccessSettingsUncheckedUpdateInput){return this.prisma.guestAccessSettings.update({where:{id},data});} createAuditLog(data:Prisma.AdminAuditLogUncheckedCreateInput){return this.prisma.adminAuditLog.create({data});} findAuditLogs(){return this.prisma.adminAuditLog.findMany({where:{module:'guestAccessSettings'},orderBy:{createdAt:'desc'},take:100});} }
