import { ApiProperty } from '@nestjs/swagger';

export class SendMessagePayloadDto {
  @ApiProperty({
    format: 'uuid',
    description: 'User ID of the recipient',
    example: 'e0dda8f1-3442-4851-b680-8e1291ee55ec',
  })
  receiverId: string;

  @ApiProperty({
    description: 'Message text',
    example: 'Hello!',
  })
  content: string;
}

export class NewMessageEventDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty({ format: 'uuid' })
  receiverId: string;

  @ApiProperty({ example: 'Hello!' })
  content: string;

  @ApiProperty({ example: '2026-10-01T12:00:00.000Z' })
  createdAt: Date;
}

export class SocketErrorEventDto {
  @ApiProperty({ example: 'Invalid or expired token' })
  message: string;
}

export class SocketProtocolInfoDto {
  @ApiProperty({ example: 'socket.io' })
  protocol: string;

  @ApiProperty({ example: 'http://localhost:3000' })
  url: string;

  @ApiProperty({ example: '/' })
  namespace: string;

  @ApiProperty({
    example: { auth: { token: '<access_token from POST /auth/login>' } },
  })
  connect: Record<string, unknown>;

  @ApiProperty({
    example: {
      event: 'send_message',
      payload: { receiverId: '<uuid>', content: 'Hello!' },
    },
  })
  clientToServer: Record<string, unknown>;

  @ApiProperty({
    example: {
      new_message: {
        id: '<uuid>',
        conversationId: '<uuid>',
        senderId: '<uuid>',
        receiverId: '<uuid>',
        content: 'Hello!',
        createdAt: '2026-10-01T12:00:00.000Z',
      },
      error: { message: 'string' },
    },
  })
  serverToClient: Record<string, unknown>;

  @ApiProperty({ example: 'http://localhost:3000/chat-test' })
  htmlTester: string;
}
