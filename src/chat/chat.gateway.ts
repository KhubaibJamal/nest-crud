import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
import { ChatService } from './chat.service.js';

interface SendMessagePayload {
  receiverId: string;
  content: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit('error', { message: 'Missing auth token' });
        client.disconnect();
        return;
      }

      const user = await this.authService.getUserFromToken(token);
      client.data.user = user;

      // Join personal room so we can target this user from anywhere
      await client.join(`user:${user.id}`);
      this.logger.log(`Client connected: ${user.id} (socket ${client.id})`);
    } catch {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.id ?? 'unknown';
    this.logger.log(`Client disconnected: ${userId} (socket ${client.id})`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const sender = client.data?.user;
    if (!sender) {
      client.emit('error', { message: 'Unauthenticated' });
      return;
    }

    const { receiverId, content } = payload ?? {};

    if (!receiverId) {
      client.emit('error', { message: 'receiverId is required' });
      return;
    }
    if (!content?.trim()) {
      client.emit('error', { message: 'content cannot be empty' });
      return;
    }

    try {
      const { message, conversation } = await this.chatService.sendMessage(
        sender.id,
        receiverId,
        content,
      );

      const outgoing = {
        id: message.id,
        conversationId: conversation.id,
        senderId: message.senderId,
        receiverId,
        content: message.content,
        createdAt: message.createdAt,
      };

      // Deliver to both participants (sender sees it too in their room)
      this.server.to(`user:${sender.id}`).emit('new_message', outgoing);
      this.server.to(`user:${receiverId}`).emit('new_message', outgoing);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      client.emit('error', { message: msg });
    }
  }

  private extractToken(client: Socket): string | null {
    // Prefer auth.token (passed in io({ auth: { token } }))
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth.replace(/^Bearer\s+/i, '');

    // Fallback: Authorization header
    const header = client.handshake.headers?.authorization as string | undefined;
    if (header?.toLowerCase().startsWith('bearer ')) {
      return header.slice(7);
    }

    return null;
  }
}
