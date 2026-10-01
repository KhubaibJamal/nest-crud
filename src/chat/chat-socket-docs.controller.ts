import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SocketProtocolInfoDto } from './entities/socket-docs.entity.js';

/**
 * Documentation-only endpoints for the Socket.IO chat protocol.
 * OpenAPI cannot execute WebSockets; use this tag as the contract reference.
 */
@ApiTags('chat-socket')
@Controller('chat/socket')
export class ChatSocketDocsController {
  @Get('info')
  @ApiOperation({
    summary: 'Socket.IO chat protocol reference',
    description: `
## Overview

Real-time 1:1 chat uses **Socket.IO** (not REST). Swagger cannot "Try it out" for sockets —
use this contract, the README, or the HTML tester at \`/chat-test\`.

## Connect

\`\`\`js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: '<access_token from POST /auth/login>' },
  transports: ['websocket'],
});
\`\`\`

Auth alternatives:
- Preferred: \`handshake.auth.token\`
- Fallback: \`Authorization: Bearer <access_token>\` header

On success the server joins you to room \`user:{yourUserId}\`.
On failure it emits \`error\` then disconnects.

## Client → Server

### \`send_message\`

\`\`\`json
{
  "receiverId": "<other-user-uuid>",
  "content": "Hello!"
}
\`\`\`

## Server → Client

### \`new_message\`

Emitted to both sender and receiver rooms.

\`\`\`json
{
  "id": "<message-uuid>",
  "conversationId": "<conversation-uuid>",
  "senderId": "<uuid>",
  "receiverId": "<uuid>",
  "content": "Hello!",
  "createdAt": "2026-10-01T12:00:00.000Z"
}
\`\`\`

### \`error\`

\`\`\`json
{ "message": "Invalid or expired token" }
\`\`\`

## Related REST

- \`GET /chat/conversations\` — inbox
- \`GET /chat/conversations/:id/messages\` — history
- \`POST /chat/conversations\` — find or create conversation
    `.trim(),
  })
  @ApiOkResponse({ type: SocketProtocolInfoDto })
  getSocketInfo(): SocketProtocolInfoDto {
    return {
      protocol: 'socket.io',
      url: 'http://localhost:3000',
      namespace: '/',
      connect: {
        auth: { token: '<access_token from POST /auth/login>' },
        transports: ['websocket'],
        note: 'CORS origin is *',
      },
      clientToServer: {
        event: 'send_message',
        payload: {
          receiverId: '<other-user-uuid>',
          content: 'Hello!',
        },
      },
      serverToClient: {
        new_message: {
          id: '<message-uuid>',
          conversationId: '<conversation-uuid>',
          senderId: '<uuid>',
          receiverId: '<uuid>',
          content: 'Hello!',
          createdAt: '2026-10-01T12:00:00.000Z',
        },
        error: { message: 'string' },
      },
      htmlTester: 'http://localhost:3000/chat-test',
    };
  }
}
