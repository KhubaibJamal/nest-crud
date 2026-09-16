import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUser {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true, example: 'jane@example.com' })
  email: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Jane Doe' })
  name?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '+1234567890' })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  isEmailVerified?: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  isPhoneVerified?: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  isAdmin?: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  avatar_url?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'ACTIVE' })
  status?: string | null;
}

export class AuthTokens {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty({ example: 3600 })
  expires_in: number;

  @ApiProperty({ example: 'bearer' })
  token_type: 'bearer';
}

export class AuthResponse {
  @ApiProperty({ type: AuthUser })
  user: AuthUser;

  @ApiProperty({ type: AuthTokens })
  session: AuthTokens;
}

export class MessageResponse {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

export class ForgotPasswordResponse {
  @ApiProperty({
    example:
      'If an account exists for that email, a password reset link has been sent.',
  })
  message: string;
}
