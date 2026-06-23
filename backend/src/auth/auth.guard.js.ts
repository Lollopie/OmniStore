import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    if (
      !request.cookies['token'] ||
      typeof request.cookies['token'] !== 'string'
    ) {
      throw new UnauthorizedException('No token provided');
    }
    const token: string = request.cookies['token'];
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload: { user_id: string; username: string } =
        await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
