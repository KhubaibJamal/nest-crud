import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../generated/prisma/index.js';
import { PrismaService } from '../prisma/prisma.module.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserEntity } from './entities/user.entity.js';

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isAdmin: true,
  avatarUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  private readonly saltRounds = 12;

  constructor(private readonly prisma: PrismaService) { }

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    await this.ensureUniqueEmail(dto.email);
    if (dto.phone) {
      await this.ensureUniquePhone(dto.phone);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        status: dto.status ?? UserStatus.ACTIVE,
        isAdmin: dto.isAdmin ?? false,
      },
      select: userPublicSelect,
    });
  }

  async findAllUsers(): Promise<UserEntity[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: userPublicSelect,
    });
  }

  async findUserById(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async updateUserById(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    await this.findUserById(id);

    if (dto.email) {
      await this.ensureUniqueEmail(dto.email, id);
    }
    if (dto.phone) {
      await this.ensureUniquePhone(dto.phone, id);
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, this.saltRounds)
      : undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email !== undefined && { email: dto.email.toLowerCase() }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.isAdmin !== undefined && { isAdmin: dto.isAdmin }),
        ...(passwordHash !== undefined && { passwordHash }),
      },
      select: userPublicSelect,
    });
  }

  async removeUserById(id: string): Promise<UserEntity> {
    await this.findUserById(id);

    return this.prisma.user.delete({
      where: { id },
      select: userPublicSelect,
    });
  }

  private async ensureUniqueEmail(email: string, excludeId?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('An account with this email already exists');
    }
  }

  private async ensureUniquePhone(phone: string, excludeId?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('An account with this phone already exists');
    }
  }
}
