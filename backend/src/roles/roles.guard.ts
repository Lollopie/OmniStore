import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { Role } from './roles.enum';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedRequest } from '../user/user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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

    // 1. Inject warehouse context into AsyncLocalStorage for downstream DB transactions
    this.cls.set('warehouseId', user.activeWarehouseId);

    // 2. Evaluate RBAC
    if (!requiredRoles) return true; // Endpoint is public-role

    const hasRole = requiredRoles.some((role) =>
      user.activeRole?.includes(role),
    );
    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
