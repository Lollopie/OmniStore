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
import { GuardDBService } from '../utils/guardDB.service';
import { RevocationService } from './revocation.service';
import { ACCESS_COOKIE } from './cookies';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly clsService: ClsService,
    private readonly guardDBService: GuardDBService,
    private readonly revocationService: RevocationService,
  ) {}
  async validateToken(request: Request): Promise<any> {
    if (
      !request.cookies ||
      !request.cookies[ACCESS_COOKIE] ||
      typeof request.cookies[ACCESS_COOKIE] !== 'string'
    ) {
      throw new UnauthorizedException('No token provided');
    }
    const token: string = request.cookies[ACCESS_COOKIE];
    let cookie: Cookie;
    try {
      cookie = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    // Tokens outlive removed members and deleted organizations. Removals are
    // recorded in Redis; the database is only asked when Redis can't answer.
    const status = await this.revocationService.check(
      cookie.userId,
      cookie.iat,
    );
    if (
      status === 'revoked' ||
      (status === 'unknown' &&
        cookie.orgId &&
        !(await this.guardDBService.getUserOrgRole(
          cookie.userId,
          cookie.orgId,
        )))
    ) {
      throw new UnauthorizedException('Invalid token');
    }
    request['user'] = cookie;
    this.clsService.set('orgId', cookie.orgId);
    this.clsService.set('warehouseId', cookie.activeWarehouseId);
    this.clsService.set('userId', cookie.userId);
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    await this.validateToken(request);
    return true;
  }
}
