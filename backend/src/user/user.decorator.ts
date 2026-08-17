import {
  createParamDecorator,
  ExecutionContext,
  Request,
} from '@nestjs/common';

export type Cookie = {
  username: string;
  userId: string;
  orgId: string;
  activeWarehouseId: string;
  activeRole: string;
};

export interface AuthenticatedRequest extends Request {
  user: Cookie;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Cookie => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
