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
import { WAREHOUSE_ROLES_KEY } from './warehouseRoles.decorator';
import { AuthenticatedRequest } from '../../user/user.decorator';
import { GuardDBService } from '../../utils/guardDB.service';

@Injectable()
export class WarehouseRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly clsService: ClsService,
    private readonly guardDBService: GuardDBService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WarehouseRole[]>(
      WAREHOUSE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request: AuthenticatedRequest = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const user: {
      userId: string;
      username: string;
      activeWarehouseId: string;
      activeRole: string;
    } = request['user'];
    if (!user) return false;
    if (!user.activeWarehouseId) {
      throw new BadRequestException('No active Warehouse found');
    }
    if (!(await this.guardDBService.findWarehouse(user.activeWarehouseId))) {
      throw new BadRequestException('Active Warehouse not found');
    }

    const userRole = await this.guardDBService.getUserWarehouseRole(
      user.userId,
      user.activeWarehouseId,
    );
    if (!userRole) {
      throw new ForbiddenException(
        'You do not have access to the active warehouse',
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
    this.clsService.set('warehouseRole', userRole);
    return true;
  }
}
