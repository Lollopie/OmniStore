import { Injectable } from '@nestjs/common';
import { TxRepoProvider } from '../rls/db.helper';
import { UserOrganizationRoleEntity } from './userOrganizationRole.entity';

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
}
