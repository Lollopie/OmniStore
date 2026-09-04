export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export const ORG_INVITATION_PERMISSIONS: Record<OrganizationRole, OrganizationRole[]> = {
  [OrganizationRole.OWNER]: [OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MEMBER],
  [OrganizationRole.ADMIN]: [OrganizationRole.ADMIN, OrganizationRole.MEMBER],
  [OrganizationRole.MEMBER]: [],
};