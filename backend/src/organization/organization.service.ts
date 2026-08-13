import { Injectable } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { TxRepoProvider } from '../rls/db.helper';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from '../user/user.entity';
import { PasswordService } from '../auth/password.service';
import { mapRow } from '../utils/helper';
@Injectable()
export class OrganizationService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly passwordService: PasswordService,
  ) {}
  async createOrganization(data: OrganizationDto) {
    const organizationRepo = this.txRepoProvider.getRepo(OrganizationEntity);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const user = userRepo.create({
      username: data.ownerUsername,
      email: data.ownerEmail,
      password: await this.passwordService.hashPassword(data.ownerPassword),
    });
    const savedUser = await userRepo.save(user);
    const [rawOrg]: OrganizationEntity[] = await organizationRepo.query(
      `SELECT * FROM create_organization($1, $2)`,
      [data.name, savedUser.userId],
    );
    const org = mapRow(organizationRepo, rawOrg);
    return { user: savedUser, organization: org };
  }
  async findOne(id: string): Promise<OrganizationEntity | null> {
    const organizationRepo = this.txRepoProvider.getRepo(OrganizationEntity);
    return await organizationRepo.findOne({ where: { orgId: id } });
  }
}
