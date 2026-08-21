import { BadRequestException, Injectable } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { TxRepoProvider } from '../rls/db.helper';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from '../user/user.entity';
import { mapRow } from '../utils/helper';
import { AuthService } from '../auth/auth.service';
import { InviteEntity } from '../invite/invite.entity';
@Injectable()
export class OrganizationService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly authService: AuthService,
  ) {}
  async createOrganization(rawToken: string, data: OrganizationDto) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const token = this.authService.hashToken(rawToken);
    try {
      const [invite]: InviteEntity[] = await inviteRepo.query(
        'SELECT consume_invite($1, $2) AS invite',
        [token, false],
      );
      if (!invite) {
        throw new Error('Invalid or expired token');
      }
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
    const organizationRepo = this.txRepoProvider.getRepo(OrganizationEntity);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const user = userRepo.create({
      username: data.ownerUsername,
      email: data.ownerEmail,
      password: await this.authService.hashPassword(data.ownerPassword),
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
