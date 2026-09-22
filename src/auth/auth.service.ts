import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '../generated/prisma/index.js';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.module.js';
import { MailService } from '../mail/mail.module.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import {
  AuthResponse,
  AuthTokens,
  AuthUser,
} from './entities/user.entity.js';

type JwtPayload = {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
};

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) { }

  async signup(dto: SignupDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    if (dto.phone) {
      const phoneTaken = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneTaken) {
        throw new ConflictException('An account with this phone already exists');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const rawToken = randomBytes(32).toString('hex');
    const emailVerificationToken = this.hashToken(rawToken);
    const emailVerificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24h

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone ?? null,
        status: UserStatus.ACTIVE,
        isEmailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    const redirect = this.config.getOrThrow<string>('EMAIL_VERIFY_REDIRECT_URL');
    const verifyUrl = `${redirect}?token=${rawToken}`;

    try {
      await this.mail.sendEmailVerificationEmail(user.email, verifyUrl);
    } catch {
      throw new BadRequestException(
        'Account created but verification email could not be sent. Please try again later.',
      );
    }

    return {
      message: 'Verification link sent to email',
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('User is banned or does not exist');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    return this.issueSession(user);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (!token?.trim()) {
      throw new BadRequestException('Verification token is required');
    }

    const emailVerificationToken = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    const message =
      'If an account exists for that email, a password reset link has been sent.';

    // Always return the same message to avoid email enumeration.
    if (!user) {
      return { message };
    }

    const resetToken = randomBytes(32).toString('hex');
    const passwordResetToken = this.hashToken(resetToken);
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken, passwordResetExpires },
    });

    const redirect = this.config.getOrThrow<string>(
      'PASSWORD_RESET_REDIRECT_URL',
    );
    const resetUrl = `${redirect}?token=${resetToken}`;

    try {
      await this.mail.sendPasswordResetEmail(user.email, resetUrl);
    } catch {
      throw new BadRequestException(
        'Could not send password reset email. Please try again later.',
      );
    }

    return { message };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const passwordResetToken = this.hashToken(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshTokenHash: null,
      },
    });

    return { message: 'Password updated successfully' };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const matches = await bcrypt.compare(
      dto.refresh_token,
      user.refreshTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.issueSession(user);
  }

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const matches = await bcrypt.compare(
      dto.refresh_token,
      user.refreshTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: null },
    });

    return { message: 'Logged out successfully' };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toAuthUser(user);
  }

  async getUserFromToken(accessToken: string): Promise<AuthUser> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return this.toAuthUser(user);
  }

  private async issueSession(user: User): Promise<AuthResponse> {
    const tokens = await this.createTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refresh_token, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return {
      user: this.toAuthUser(user),
      session: tokens,
    };
  }

  private async createTokens(user: User): Promise<AuthTokens> {
    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '1h';
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const base = { sub: user.id, email: user.email };

    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(
        { ...base, type: 'access' satisfies JwtPayload['type'] },
        { expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` },
      ),
      this.jwt.signAsync(
        { ...base, type: 'refresh' satisfies JwtPayload['type'] },
        { expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` },
      ),
    ]);

    return {
      access_token,
      refresh_token,
      expires_in: this.expiresInSeconds(accessExpiresIn),
      token_type: 'bearer',
    };
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isAdmin: user.isAdmin,
      avatar_url: user.avatarUrl,
      status: user.status,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private expiresInSeconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 3600;
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return amount * (multipliers[unit] ?? 3600);
  }
}
