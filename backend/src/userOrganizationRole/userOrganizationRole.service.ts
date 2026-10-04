import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TxRepoProvider } from '../rls/txrepo.service';
import { UserOrganizationRoleEntity } from './userOrganizationRole.entity';
import { UserEntity } from '../user/user.entity';
import {
  ORG_INVITATION_PERMISSIONS,
  OrganizationRole,
} from '@shared/enum/organizationRoles.enum';

@Injectable()
export class UserOrganizationRoleService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
  ) {}
  async updateUserRole(username: string, newRole: string) {
    const userOrgRoleRepo = this.txRepoProvider.getRepo(
      UserOrganizationRoleEntity,
    );
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const user = await userRepo.findOne({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userOrgRole = await this.findMembership(user.userId);
    this.assertCanManage(userOrgRole.role);
    this.assertCanManage(newRole);
    if (newRole !== OrganizationRole.OWNER) {
      await this.assertNotLastOwner(user.userId, userOrgRole.orgId);
    }
    userOrgRole.role = newRole;
    return await userOrgRoleRepo.save(userOrgRole);
  }
  /**
   * Removes a member from the organization. Users belong to exactly one
   * organization, so this deletes their account.
   */
  async removeMember(userId: string): Promise<void> {
    const userOrgRole = await this.findMembership(userId);
    this.assertCanManage(userOrgRole.role);
    await this.assertNotLastOwner(userId, userOrgRole.orgId);
    await this.txRepoProvider.getRepo(UserEntity).delete({ userId });
  }
  /** Throws if the user is the only owner left in the organization. */
  async assertNotLastOwner(userId: string, orgId: string): Promise<void> {
    const userOrgRoleRepo = this.txRepoProvider.getRepo(
      UserOrganizationRoleEntity,
    );
    const membership = await userOrgRoleRepo.findOne({
      where: { userId, orgId },
    });
    if (membership?.role !== OrganizationRole.OWNER) {
      return;
    }
    const owners = await userOrgRoleRepo.count({
      where: { orgId: membership.orgId, role: OrganizationRole.OWNER },
    });
    if (owners <= 1) {
      throw new BadRequestException(
        'An organization must have at least one owner',
      );
    }
  }
  private async findMembership(userId: string) {
    const orgId: string = this.clsService.get('orgId');
    const userOrgRole = await this.txRepoProvider
      .getRepo(UserOrganizationRoleEntity)
      .findOne({ where: { userId, orgId } });
    if (!userOrgRole) {
      throw new NotFoundException('User not found in organization');
    }
    return userOrgRole;
  }
  // Owners manage everyone, admins only admins and members
  private assertCanManage(role: string) {
    const actorRole = this.clsService.get<OrganizationRole>('orgRole');
    const manageableRoles: string[] =
      ORG_INVITATION_PERMISSIONS[actorRole] ?? [];
    if (!manageableRoles.includes(role)) {
      throw new ForbiddenException(
        'You do not have permission to manage users with this role',
      );
    }
  }
}
