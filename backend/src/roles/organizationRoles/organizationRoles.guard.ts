import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLES_KEY } from './organizationRoles.decorator';
import { AuthenticatedRequest, UserToken } from '../../user/user.decorator';
import { GuardDBService } from '../../utils/guardDB.service';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly cls: ClsService,
    private readonly guardDBService: GuardDBService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrganizationRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request: AuthenticatedRequest = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const user: UserToken = request['user'];
    if (!user) return false;
    if (!user.orgId) {
      throw new BadRequestException('No organization found');
    }
    if (!(await this.guardDBService.getOrg(user.orgId))) {
      throw new BadRequestException('Organization not found');
    }

    this.cls.set('orgId', user.orgId);

    const userRole: OrganizationRole = await this.guardDBService.getUserOrgRole(
      user.userId,
      user.orgId,
    );
    if (!userRole) {
      throw new ForbiddenException(
        'You do not have access to the active organization',
      );
    }

    if (requiredRoles?.length) {
      const userHasRole = requiredRoles.includes(userRole);

      if (!userHasRole) {
        throw new ForbiddenException(
          'You do not have the required role to access this resource',
        );
      }
    }

    return true;
  }
}
