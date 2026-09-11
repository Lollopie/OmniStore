import { Injectable, NotFoundException } from '@nestjs/common';
import { TxRepoProvider } from '../rls/txrepo.service';
import { UserOrganizationRoleEntity } from './userOrganizationRole.entity';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class UserOrganizationRoleService {
  constructor(private readonly txRepoProvider: TxRepoProvider) {}
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
    const userOrgRole = await userOrgRoleRepo.findOne({
      where: { userId: user.userId },
    });
    if (!userOrgRole) {
      throw new NotFoundException('User not found in organization');
    }
    userOrgRole.role = newRole;
    return await userOrgRoleRepo.save(userOrgRole);
  }
}
