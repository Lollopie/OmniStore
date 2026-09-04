import { SetMetadata } from '@nestjs/common';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
export const ROLES_KEY = 'roles';
export const OrganizationRoles = (...roles: OrganizationRole[]) =>
  SetMetadata(ROLES_KEY, roles);
