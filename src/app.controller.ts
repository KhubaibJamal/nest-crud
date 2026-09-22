import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { join } from 'node:path';
import { AppService } from './app.service.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Service is running', type: String })
  getHello(): string {
    return this.appService.getHello();
  }

  /** HTML page opened from the forgot-password email link (?token=...). */
  @Get('reset-password')
  @ApiExcludeEndpoint()
  resetPasswordPage(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'reset-password.html'));
  }

  /** HTML page opened from the signup verification email (?token=...). */
  @Get('verify-email')
  @ApiExcludeEndpoint()
  verifyEmailPage(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'verify-email.html'));
  }
}
