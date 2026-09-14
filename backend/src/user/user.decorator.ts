import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
export type Cookie = {
  username: string;
  userId: string;
  orgId: string;
  activeWarehouseId: string;
  activeRole: string;
  exp?: number;
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
