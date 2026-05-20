import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatAttachmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCompletedUploads(params: { urls: string[]; folder: 'chat-attachments' | 'support-chat-attachments' }) {
    return this.prisma.uploadedFile.findMany({
      where: { fileUrl: { in: params.urls }, deletedAt: null, status: 'COMPLETED', folder: params.folder },
      select: { fileUrl: true },
    });
  }
}
