import { OrganizationRole } from './organizationRoles.enum';

export enum WarehouseRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

export const ORG_WAREHOUSE_INVITATION_PERMISSIONS: Record<OrganizationRole, WarehouseRole[]> = {
  [OrganizationRole.OWNER]: [WarehouseRole.ADMIN, WarehouseRole.MANAGER, WarehouseRole.STAFF],
  [OrganizationRole.ADMIN]: [WarehouseRole.ADMIN, WarehouseRole.MANAGER, WarehouseRole.STAFF],
  [OrganizationRole.MEMBER]: [],
};

export const WAREHOUSE_INVITATION_PERMISSIONS: Record<WarehouseRole, WarehouseRole[]> = {
  [WarehouseRole.ADMIN]: [WarehouseRole.ADMIN, WarehouseRole.MANAGER, WarehouseRole.STAFF],
  [WarehouseRole.MANAGER]: [WarehouseRole.STAFF],
  [WarehouseRole.STAFF]: [],
};