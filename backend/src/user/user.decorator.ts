import {
  createParamDecorator,
  ExecutionContext,
  Request,
} from '@nestjs/common';

export type UserToken = { username: string; user_id: string };

interface AuthenticatedRequest extends Request {
  user: UserToken;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserToken => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
