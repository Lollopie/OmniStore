import { SetMetadata } from '@nestjs/common';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
export const WAREHOUSE_ROLES_KEY = 'warehouseRoles';
export const WarehouseRoles = (...roles: WarehouseRole[]) =>
  SetMetadata(WAREHOUSE_ROLES_KEY, roles);
