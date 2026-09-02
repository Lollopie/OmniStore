import { Injectable } from '@nestjs/common';
import { TxRepoProvider } from '../rls/db.helper';
import { UserOrganizationRoleEntity } from './userOrganizationRole.entity';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class UserOrganizationRoleService {
  constructor(private readonly txRepoProvider: TxRepoProvider) {}
  async findRole(
    userId: string,
    orgId: string,
  ): Promise<UserOrganizationRoleEntity | null> {
    const repo = this.txRepoProvider.getRepo(UserOrganizationRoleEntity);
    return await repo.findOne({ where: { userId, orgId } });
  }
  async findByUserId(
    userId: string,
  ): Promise<UserOrganizationRoleEntity | null> {
    const repo = this.txRepoProvider.getRepo(UserOrganizationRoleEntity);
    return await repo.findOne({ where: { userId: userId } });
  }
  async updateUserRole(username: string, newRole: string) {
    const userOrgRoleRepo = this.txRepoProvider.getRepo(
      UserOrganizationRoleEntity,
    );
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const user = await userRepo.findOne({
      where: { username },
    });
    if (!user) {
      throw new Error('User not found');
    }
    const userOrgRole = await userOrgRoleRepo.findOne({
      where: { userId: user.userId },
    });
    if (!userOrgRole) {
      throw new Error('User not found in organization');
    }
    userOrgRole.role = newRole;
    return await userOrgRoleRepo.save(userOrgRole);
  }
}
