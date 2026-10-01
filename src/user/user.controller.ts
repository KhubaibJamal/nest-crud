import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/entities/user.entity.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { FindUsersQueryDto } from './dto/find-users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { UserService } from './user.service.js';

@ApiTags('user')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a user (admin only)' })
  @ApiOkResponse({ type: UserEntity })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List users available to chat with',
    description:
      'Excludes the logged-in user and all admins. Regular users only see email-verified accounts; admins see verified and unverified. Optional search by name, email, or phone.',
  })
  @ApiOkResponse({ type: [UserEntity] })
  findAllUsers(
    @CurrentUser() user: AuthUser,
    @Query() query: FindUsersQueryDto,
  ) {
    return this.userService.findAllUsers(
      user.id,
      query.search,
      Boolean(user.isAdmin),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({ type: UserEntity })
  findUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiOkResponse({ type: UserEntity })
  updateUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUserById(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiOkResponse({ type: UserEntity })
  removeUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.removeUserById(id);
  }
}
