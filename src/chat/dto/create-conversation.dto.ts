import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ format: 'uuid', description: 'The other user to chat with' })
  @IsUUID()
  otherUserId: string;
}
