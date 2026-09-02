import { BadRequestException, Injectable } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { TxRepoProvider } from '../rls/db.helper';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from '../user/user.entity';
import { mapRow } from '../utils/helper';
import { AuthService } from '../auth/auth.service';
import { InviteEntity } from '../invite/invite.entity';
import { UserOrganizationRoleEntity } from '../userOrganizationRole/userOrganizationRole.entity';
import { ClsService } from 'nestjs-cls';
@Injectable()
export class OrganizationService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly authService: AuthService,
    private readonly clsService: ClsService,
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
  async getUsers(searchTerm: string, page: number) {
    const userOrganizationRoleRepo = this.txRepoProvider.getRepo(
      UserOrganizationRoleEntity,
    );
    const orgId: string = this.clsService.get('orgId');
    const limit: number = 10;
    const skip = (page - 1) * limit;
    const queryBuilder = userOrganizationRoleRepo
      .createQueryBuilder('user_org_role')
      .innerJoin('UserEntity', 'user', 'user.userId = user_org_role.userId')
      .where('user_org_role.orgId = :orgId', {
        orgId,
      });
    const cleanedTerm = searchTerm?.trim();
    if (cleanedTerm) {
      queryBuilder.andWhere('user.username ILIKE :search', {
        search: `%${cleanedTerm}%`,
      });
    }
    const total = await queryBuilder.getCount();
    const rawResults: {
      userId: string;
      username: string;
      role: string;
    }[] = await queryBuilder
      .select([
        'user.userId AS "userId"',
        'user.username AS username',
        'user_org_role.role AS role',
      ])
      .offset(skip)
      .limit(limit)
      .getRawMany();

    return {
      data: rawResults,
      total,
    };
  }
}
