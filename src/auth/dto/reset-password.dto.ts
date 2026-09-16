import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token returned by forgot-password',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @MinLength(1)
  token: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
