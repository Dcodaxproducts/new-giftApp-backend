import { Injectable } from '@nestjs/common';
import { Prisma, ProviderDocumentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProviderProfileByUserId(userId: string) {
    return this.prisma.providerProfile.findUnique({ where: { userId } });
  }

  findProviderProfileById(profileId: string) {
    return this.prisma.providerProfile.findUnique({ where: { id: profileId } });
  }

  findProviderUserById(userId: string) {
    return this.prisma.user.findFirst({ where: { id: userId, role: UserRole.PROVIDER } });
  }

  findDocumentById(id: string) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  findActiveDocuments() {
    return this.prisma.document.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  }

  findProviderDocument(providerProfileId: string, documentId: string) {
    return this.prisma.providerDocument.findUnique({
      where: { providerProfileId_documentTypeId: { providerProfileId, documentTypeId: documentId } },
    });
  }

  findProviderDocuments(providerProfileId: string) {
    return this.prisma.providerDocument.findMany({
      where: { providerProfileId },
      include: { documentType: { select: { id: true, name: true, isRequired: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  createProviderDocument(data: Prisma.ProviderDocumentUncheckedCreateInput) {
    return this.prisma.providerDocument.create({
      data,
      include: { documentType: { select: { id: true, name: true, isRequired: true } } },
    });
  }

  updateProviderDocument(id: string, data: Prisma.ProviderDocumentUncheckedUpdateInput) {
    return this.prisma.providerDocument.update({
      where: { id },
      data,
      include: { documentType: { select: { id: true, name: true, isRequired: true } } },
    });
  }
}
