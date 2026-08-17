import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Cookie } from '../user/user.decorator';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly clsService: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    if (
      !request.cookies ||
      !request.cookies['token'] ||
      typeof request.cookies['token'] !== 'string'
    ) {
      throw new UnauthorizedException('No token provided');
    }
    const token: string = request.cookies['token'];
    try {
      const cookie: Cookie = await this.jwtService.verifyAsync(token);
      request['user'] = cookie;
      this.clsService.set('orgId', cookie.orgId);
      this.clsService.set('warehouseId', cookie.activeWarehouseId);
      this.clsService.set('userId', cookie.userId);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
