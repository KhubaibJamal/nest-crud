import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import type { AuthUser } from '../auth/entities/user.entity.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ChatService } from './chat.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { InboxQueryDto } from './dto/inbox-query.dto.js';
import { PaginationDto } from './dto/pagination.dto.js';
import {
  ConversationListResponse,
  MessageListResponse,
} from './entities/chat.entity.js';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Find or create a 1:1 conversation' })
  findOrCreate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.findOrCreateConversation(user.id, dto.otherUserId);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get my inbox (paginated, newest first)',
    description:
      'Optional search filters by the other participant name, email, or phone.',
  })
  @ApiOkResponse({ type: ConversationListResponse })
  getInbox(
    @CurrentUser() user: AuthUser,
    @Query() query: InboxQueryDto,
  ): Promise<ConversationListResponse> {
    return this.chatService.getInbox(
      user.id,
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (paginated, newest first)' })
  @ApiOkResponse({ type: MessageListResponse })
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationDto,
  ): Promise<MessageListResponse> {
    return this.chatService.getMessages(user.id, id, query.page, query.limit);
  }
}
