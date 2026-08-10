import { Injectable } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { TxRepoProvider } from '../rls/db.helper';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from '../user/user.entity';
import { PasswordService } from '../auth/password.service';
import { UserOrganizationRoleEntity } from '../userOrganizationRole/userOrganizationRole.entity';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly passwordService: PasswordService,
  ) {}
  async createOrganization(data: OrganizationDto) {
    const organizationRepo = this.txRepoProvider.getRepo(OrganizationEntity);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const userOrgRoleRepo = this.txRepoProvider.getRepo(
      UserOrganizationRoleEntity,
    );
    const org = organizationRepo.create({ name: data.name });
    const user = userRepo.create({
      username: data.ownerUsername,
      email: data.ownerEmail,
      password: await this.passwordService.hashPassword(data.ownerPassword),
    });
    const userOrgRole = userOrgRoleRepo.create({
      userId: user.userId,
      orgId: org.orgId,
      role: OrganizationRole.OWNER,
    });
    await organizationRepo.save(org);
    await userRepo.save(user);
    await userOrgRoleRepo.save(userOrgRole);
    return { message: 'Organization created successfully' };
  }
  async findOne(id: string): Promise<OrganizationEntity | null> {
    const organizationRepo = this.txRepoProvider.getRepo(OrganizationEntity);
    return await organizationRepo.findOne({ where: { orgId: id } });
  }
}
