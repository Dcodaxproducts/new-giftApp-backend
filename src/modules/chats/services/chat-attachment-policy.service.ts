import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatAttachmentRepository } from '../repositories/chat-attachment.repository';

@Injectable()
export class ChatAttachmentPolicyService {
  constructor(private readonly attachments: ChatAttachmentRepository) {}

  async assertCompleted(urls: string[], folder: 'chat-attachments' | 'support-chat-attachments') {
    if (!urls.length) return;
    const rows = await this.attachments.findCompletedUploads({ urls, folder });
    const found = new Set(rows.map((row) => row.fileUrl));
    const missing = urls.filter((url) => !found.has(url));
    if (missing.length) throw new BadRequestException(`Attachments must use completed ${folder} uploads`);
  }
}
