import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ChatSocketDocsController } from './chat-socket-docs.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [ChatController, ChatSocketDocsController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
