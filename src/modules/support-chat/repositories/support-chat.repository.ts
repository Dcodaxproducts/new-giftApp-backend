import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma, SupportChatSenderType, SupportChatStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
export const SUPPORT_CHAT_INCLUDE = Prisma.validator<Prisma.SupportChatInclude>()({ participant: { select: { id: true, role: true, firstName: true, lastName: true, avatarUrl: true, providerBusinessName: true } }, assignedAdmin: { select: { id: true, firstName: true, lastName: true } }, lastMessage: true });
export const SUPPORT_CHAT_MESSAGE_INCLUDE = Prisma.validator<Prisma.SupportChatMessageInclude>()({ sender: { select: { id: true, role: true, firstName: true, lastName: true, avatarUrl: true, providerBusinessName: true } } });
@Injectable()
export class SupportChatRepository { constructor(private readonly prisma: PrismaService) {}
  findChats<T extends Prisma.SupportChatFindManyArgs>(args: T): Promise<Prisma.SupportChatGetPayload<T>[]> { return this.prisma.supportChat.findMany(args) as Promise<Prisma.SupportChatGetPayload<T>[]>; }
  countChats(where: Prisma.SupportChatWhereInput) { return this.prisma.supportChat.count({ where }); }
  findChatById(id: string) { return this.prisma.supportChat.findUnique({ where: { id }, include: SUPPORT_CHAT_INCLUDE }); }
  findMessages(supportChatId: string) { return this.prisma.supportChatMessage.findMany({ where: { supportChatId }, include: SUPPORT_CHAT_MESSAGE_INCLUDE, orderBy: { createdAt: 'asc' } }); }
  createAdminMessage(params: { supportChatId: string; senderId: string; messageType: string; body?: string | null; attachmentUrls: string[] }) { return this.prisma.$transaction(async (tx) => { const message = await tx.supportChatMessage.create({ data: { supportChatId: params.supportChatId, senderId: params.senderId, senderType: SupportChatSenderType.ADMIN, messageType: params.messageType as never, body: params.body, attachmentUrlsJson: params.attachmentUrls, readByAdminAt: new Date() } }); await tx.supportChat.update({ where: { id: params.supportChatId }, data: { status: SupportChatStatus.ACTIVE, lastMessageId: message.id, lastMessageAt: message.createdAt, participantUnreadCount: { increment: 1 } } }); return message; }); }
  markRead(id: string) { return this.prisma.supportChat.update({ where: { id }, data: { adminUnreadCount: 0 } }); }
  resolve(id: string, adminId: string) { return this.prisma.supportChat.update({ where: { id }, data: { status: SupportChatStatus.RESOLVED, resolvedAt: new Date(), resolvedById: adminId } }); }
  reopen(id: string) { return this.prisma.supportChat.update({ where: { id }, data: { status: SupportChatStatus.ACTIVE, resolvedAt: null, resolvedById: null } }); }
  createNotification(input: { recipientId: string; recipientType: NotificationRecipientType; title: string; message: string; type: string; metadataJson: Prisma.InputJsonValue }) { return this.prisma.notification.create({ data: input }); }
  findCompletedUploadsByUrls(urls: string[]) { return this.prisma.uploadedFile.findMany({ where: { fileUrl: { in: urls }, deletedAt: null, status: 'COMPLETED', folder: 'support-chat-attachments' }, select: { fileUrl: true } }); }
}
