import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { Role } from '@shared/enum/roles.enum';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedRequest } from '../user/user.decorator';
import { WarehouseService } from '../warehouse/warehouse.service';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly cls: ClsService,
    private readonly warehouseService: WarehouseService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request: AuthenticatedRequest = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const user: {
      user_id: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = request['user'];
    if (!user) return false;
    if (!user.activeWarehouseId) {
      throw new BadRequestException('No active Warehouse found');
    }
    if (!(await this.warehouseService.findOne(user.activeWarehouseId))) {
      throw new BadRequestException('Active Warehouse not found');
    }

    this.cls.set('warehouseId', user.activeWarehouseId);

    if (!requiredRoles) return true;

    const userRole = await this.userWarehouseRoleService.findRole(
      user.user_id,
      user.activeWarehouseId,
    );
    if (!userRole) {
      throw new ForbiddenException(
        'You do not have a role for the active warehouse',
      );
    }
    const userHasRole = requiredRoles.some((role) =>
      userRole.role?.includes(role),
    );
    if (!userHasRole) {
      throw new ForbiddenException(
        'You do not have the required role to access this resource',
      );
    }
    return true;
  }
}
