import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { UserService } from './user.service.js';

@ApiTags('user')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a user (admin only)' })
  @ApiOkResponse({ type: UserEntity })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiOkResponse({ type: [UserEntity] })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  findAllUsers() {
    return this.userService.findAllUsers();
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
