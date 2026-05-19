import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatParticipantRole, UserRole } from '@prisma/client';
import { ChatParticipantRepository } from '../repositories/chat-participant.repository';

@Injectable()
export class ChatParticipantService {
  constructor(private readonly participants: ChatParticipantRepository) {}

  addParticipant(threadId: string, userId: string, role: UserRole) {
    return this.participants.upsert({ threadId, userId, role: this.participantRole(role) });
  }

  participantRole(role: UserRole): ChatParticipantRole {
    if (role === UserRole.REGISTERED_USER) return ChatParticipantRole.REGISTERED_USER;
    if (role === UserRole.PROVIDER) return ChatParticipantRole.PROVIDER;
    if (role === UserRole.ADMIN) return ChatParticipantRole.ADMIN;
    if (role === UserRole.SUPER_ADMIN) return ChatParticipantRole.SUPER_ADMIN;
    throw new BadRequestException('Unsupported chat participant role');
  }
}
