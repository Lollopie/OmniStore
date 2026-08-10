import { SetMetadata } from '@nestjs/common';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
export const ROLES_KEY = 'roles';
export const WarehouseRoles = (...roles: WarehouseRole[]) =>
  SetMetadata(ROLES_KEY, roles);
