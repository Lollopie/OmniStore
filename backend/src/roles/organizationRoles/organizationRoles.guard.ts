import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLES_KEY } from './organizationRoles.decorator';
import { AuthenticatedRequest } from '../../user/user.decorator';
import { OrganizationService } from '../../organization/organization.service';
import { UserOrganizationRoleService } from '../../userOrganizationRole/userOrganizationRole.service';

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly cls: ClsService,
    private readonly organizationService: OrganizationService,
    private readonly userOrganizationRoleService: UserOrganizationRoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WarehouseRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request: AuthenticatedRequest = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const user: {
      userId: string;
      username: string;
      orgId: string;
      activeWarehouseId: string;
      activeRole: string;
    } = request['user'];
    if (!user) return false;
    if (!user.orgId) {
      throw new BadRequestException('No organization found');
    }
    if (!(await this.organizationService.findOne(user.orgId))) {
      throw new BadRequestException('Organization not found');
    }

    this.cls.set('orgId', user.orgId);

    const userRole = await this.userOrganizationRoleService.findRole(
      user.userId,
      user.orgId,
    );
    if (!userRole) {
      throw new ForbiddenException(
        'You do not have access to the active organization',
      );
    }

    if (requiredRoles?.length) {
      const userHasRole = requiredRoles.some((role) =>
        userRole.role?.includes(role),
      );
      if (!userHasRole) {
        throw new ForbiddenException(
          'You do not have the required role to access this resource',
        );
      }
    }

    return true;
  }
}
