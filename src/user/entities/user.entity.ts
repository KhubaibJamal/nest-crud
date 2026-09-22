import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../generated/prisma/index.js';

export class UserEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiPropertyOptional({ nullable: true, example: '+1234567890' })
  phone: string | null;

  @ApiProperty({ example: false })
  isEmailVerified: boolean;

  @ApiProperty({ example: false })
  isPhoneVerified: boolean;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
  })
  avatarUrl: string | null;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: '2026-09-21T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-21T12:00:00.000Z' })
  updatedAt: Date;
}
