import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TxRepoProvider } from '../rls/txrepo.service';
import { InviteEntity } from './invite.entity';
import { ClsService } from 'nestjs-cls';
import { RegisterDto } from '@shared/dto/register.dto';
import { UserEntity } from '../user/user.entity';
import { AuthService } from '../auth/auth.service';
import { mapRow } from '../utils/helper';
import { WarehouseEntity } from '../warehouse/warehouse.entity';
import { ConfigService } from '@nestjs/config';
import { IsNull } from 'typeorm';
import {
  ORG_INVITATION_PERMISSIONS,
  OrganizationRole,
} from '@shared/enum/organizationRoles.enum';

export interface PendingInvite {
  inviteId: string;
  email: string;
  role: string;
  warehouseId: string | null;
  warehouseName: string | null;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class InviteService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  async inviteWarehouseUser(email: string, role: string) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const warehouseRepo = this.txRepoProvider.getRepo(WarehouseEntity);
    const orgId: string = this.clsService.get('orgId');
    const warehouseId: string = this.clsService.get('warehouseId');
    const warehouse = await warehouseRepo.findOne({
      where: { warehouseId, orgId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    const rawToken = this.authService.generateRandomToken();
    const invitationDurationHours =
      this.configService.get<number>('email.inviteTokenExpiresHours') || 24;
    const expiresAt = new Date(
      Date.now() + invitationDurationHours * 60 * 60 * 1000,
    );
    const token = this.authService.hashToken(rawToken);
    const invite = inviteRepo.create({
      email,
      orgId,
      warehouseId,
      role,
      expiresAt,
      tokenHash: token,
    });
    return { invite: await inviteRepo.save(invite), rawToken: rawToken };
  }
  /**
   * Invites a new user to the organization only. For org-only invites the
   * invite role is the org role (warehouse invites store the warehouse role).
   */
  async inviteOrganizationUser(email: string, role: OrganizationRole) {
    this.assertCanGrantOrgRole(role);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    if (await userRepo.findOne({ where: { email } })) {
      throw new BadRequestException('User already exists');
    }
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const orgId: string = this.clsService.get('orgId');
    // Only one invite per email can ever be accepted, so older ones are dropped
    await inviteRepo.delete({ email, orgId, consumedAt: IsNull() });
    const { rawToken, tokenHash, expiresAt } = this.createInviteToken();
    const invite = inviteRepo.create({
      email,
      orgId,
      role,
      expiresAt,
      tokenHash,
    });
    return { invite: await inviteRepo.save(invite), rawToken };
  }
  /** Lists the org's unconsumed invites, including expired ones. */
  async getPendingInvites(): Promise<PendingInvite[]> {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const orgId: string = this.clsService.get('orgId');
    return await inviteRepo
      .createQueryBuilder('invite')
      .leftJoin('invite.warehouse', 'warehouse')
      .select([
        'invite.inviteId AS "inviteId"',
        'invite.email AS email',
        'invite.role AS role',
        'invite.warehouseId AS "warehouseId"',
        'warehouse.name AS "warehouseName"',
        'invite.expiresAt AS "expiresAt"',
        'invite.createdAt AS "createdAt"',
      ])
      .where('invite.orgId = :orgId', { orgId })
      .andWhere('invite.consumedAt IS NULL')
      .orderBy('invite.createdAt', 'DESC')
      .getRawMany<PendingInvite>();
  }
  async revokeInvite(inviteId: string): Promise<void> {
    const invite = await this.findManageableInvite(inviteId);
    await this.txRepoProvider
      .getRepo(InviteEntity)
      .delete({ inviteId: invite.inviteId });
  }
  /** Issues a new token and expiry, invalidating the previously sent link. */
  async resendInvite(inviteId: string) {
    const invite = await this.findManageableInvite(inviteId);
    const { rawToken, tokenHash, expiresAt } = this.createInviteToken();
    invite.tokenHash = tokenHash;
    invite.expiresAt = expiresAt;
    return {
      invite: await this.txRepoProvider.getRepo(InviteEntity).save(invite),
      rawToken,
    };
  }
  private async findManageableInvite(inviteId: string) {
    const invite = await this.txRepoProvider.getRepo(InviteEntity).findOne({
      where: {
        inviteId,
        orgId: this.clsService.get<string>('orgId'),
        consumedAt: IsNull(),
      },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    // Warehouse invites always grant the member org role
    if (!invite.warehouseId) {
      this.assertCanGrantOrgRole(invite.role as OrganizationRole);
    }
    return invite;
  }
  private assertCanGrantOrgRole(role: OrganizationRole) {
    const actorRole = this.clsService.get<OrganizationRole>('orgRole');
    if (!(ORG_INVITATION_PERMISSIONS[actorRole] ?? []).includes(role)) {
      throw new ForbiddenException(
        'You do not have permission to invite users with this role',
      );
    }
  }
  private createInviteToken() {
    const rawToken = this.authService.generateRandomToken();
    const invitationDurationHours =
      this.configService.get<number>('email.inviteTokenExpiresHours') || 24;
    return {
      rawToken,
      tokenHash: this.authService.hashToken(rawToken),
      expiresAt: new Date(
        Date.now() + invitationDurationHours * 60 * 60 * 1000,
      ),
    };
  }
  async acceptInvite(rawToken: string, registerDto: RegisterDto) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const token = this.authService.hashToken(rawToken);
    const requireEmail = null;
    const email = null;
    const requireOrg = true;
    const [invite]: InviteEntity[] = await this.txRepoProvider
      .getManager()
      .query<InviteEntity[]>(`SELECT * FROM consume_invite($1, $2, $3, $4)`, [
        token,
        requireEmail,
        email,
        requireOrg,
      ])
      .catch(() => {
        throw new BadRequestException('Invite invalid or expired');
      });
    const mappedInvite = mapRow(inviteRepo, invite);
    let user = await userRepo.findOne({
      where: { email: mappedInvite.email },
    });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    user = userRepo.create({
      email: mappedInvite.email,
      username: registerDto.username,
      password: await this.authService.hashPassword(registerDto.password),
    });
    await userRepo.save(user);
    await this.txRepoProvider
      .getManager()
      .query('SELECT grant_invite_role($1, $2, $3, $4)', [
        user.userId,
        mappedInvite.orgId,
        mappedInvite.warehouseId,
        mappedInvite.role,
      ]);

    return user;
  }
  async inviteOrganizationRegister(email: string) {
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const user = await userRepo.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const rawToken = this.authService.generateRandomToken();
    const registerDurationMinutes =
      this.configService.get<number>('email.registerTokenExpiresMinutes') || 30;
    const expiresAt = new Date(
      Date.now() + registerDurationMinutes * 60 * 1000,
    );
    const token = this.authService.hashToken(rawToken);
    const [invite]: InviteEntity[] = await inviteRepo.query<InviteEntity[]>(
      'SELECT * from create_org_registration($1, $2, $3)',
      [email, token, expiresAt],
    );
    return { invite: mapRow(inviteRepo, invite), rawToken: rawToken };
  }
  async validateInvite(rawToken: string) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const token = this.authService.hashToken(rawToken);
    const [invite]: InviteEntity[] = await inviteRepo.query<InviteEntity[]>(
      'SELECT * FROM validate_invite($1)',
      [token],
    );
    if (!invite) {
      throw new BadRequestException('Invite invalid or expired');
    }
    return mapRow(inviteRepo, invite);
  }
}
