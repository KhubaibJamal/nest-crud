import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';
import type { ConversationListResponse, MessageListResponse } from './entities/chat.entity.js';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** Deterministically order the two UUIDs so the unique constraint never dups. */
  private orderParticipants(
    a: string,
    b: string,
  ): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  /** Find or create a 1-to-1 conversation between two users. */
  async findOrCreateConversation(
    requesterId: string,
    otherUserId: string,
  ) {
    if (requesterId === otherUserId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    // Verify the other user exists
    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, avatarUrl: true },
    });
    if (!other) throw new NotFoundException('User not found');

    const [p1, p2] = this.orderParticipants(requesterId, otherUserId);

    const conversation = await this.prisma.conversation.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      create: { participant1Id: p1, participant2Id: p2 },
      update: {},
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversation;
  }

  /** Inbox: all conversations for a user, newest first. */
  async getInbox(
    userId: string,
    page: number,
    limit: number,
  ): Promise<ConversationListResponse> {
    const where = {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    };

    const [total, conversations] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          participant1: { select: { id: true, name: true, avatarUrl: true } },
          participant2: { select: { id: true, name: true, avatarUrl: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const data = conversations.map((c) => {
      const otherUser =
        c.participant1Id === userId ? c.participant2 : c.participant1;
      const lastMessage = c.messages[0] ?? null;
      return {
        id: c.id,
        otherUser,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              conversationId: lastMessage.conversationId,
              senderId: lastMessage.senderId,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
            }
          : null,
        lastMessageAt: c.lastMessageAt,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Messages in a conversation, newest first. Requester must be a participant. */
  async getMessages(
    userId: string,
    conversationId: string,
    page: number,
    limit: number,
  ): Promise<MessageListResponse> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const where = { conversationId };
    const [total, messages] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: messages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Persist a message and bump lastMessageAt. Used by the gateway. */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send a message to yourself');
    }
    if (!content?.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const [p1, p2] = this.orderParticipants(senderId, receiverId);

    const conversation = await this.prisma.conversation.upsert({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      create: { participant1Id: p1, participant2Id: p2 },
      update: { lastMessageAt: new Date() },
    });

    // Ensure lastMessageAt is updated even when the conversation already existed
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content: content.trim(),
      },
    });

    return { conversation, message };
  }
}
