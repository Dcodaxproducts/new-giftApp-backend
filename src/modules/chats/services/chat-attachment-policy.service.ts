import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatAttachmentPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCompleted(urls: string[], folder: 'chat-attachments' | 'support-chat-attachments') {
    if (!urls.length) return;
    const rows = await this.prisma.uploadedFile.findMany({
      where: { fileUrl: { in: urls }, deletedAt: null, status: 'COMPLETED', folder },
      select: { fileUrl: true },
    });
    const found = new Set(rows.map((row) => row.fileUrl));
    const missing = urls.filter((url) => !found.has(url));
    if (missing.length) throw new BadRequestException(`Attachments must use completed ${folder} uploads`);
  }
}
