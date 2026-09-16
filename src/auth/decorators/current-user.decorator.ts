import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../entities/user.entity.js';
import type { AuthenticatedRequest } from '../guards/auth.guard.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

export const AccessToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.accessToken;
  },
);
