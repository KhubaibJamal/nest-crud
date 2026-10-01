import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}

export class OtherUserEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;
}

export class ConversationEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: OtherUserEntity })
  otherUser: OtherUserEntity;

  @ApiPropertyOptional({ type: MessageEntity, nullable: true })
  lastMessage: MessageEntity | null;

  @ApiProperty()
  lastMessageAt: Date;
}

export class PaginationMeta {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class ConversationListResponse {
  @ApiProperty({ type: [ConversationEntity] })
  data: ConversationEntity[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}

export class MessageListResponse {
  @ApiProperty({ type: [MessageEntity] })
  data: MessageEntity[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
