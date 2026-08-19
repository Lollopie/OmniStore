import { BadRequestException, Injectable } from '@nestjs/common';
import { TxRepoProvider } from '../rls/db.helper';
import { InviteEntity } from './invite.entity';
import { ClsService } from 'nestjs-cls';
import * as crypto from 'crypto';
import { RegisterDto } from '@shared/dto/register.dto';
import { UserEntity } from '../user/user.entity';
import { AuthService } from '../auth/auth.service';
import { mapRow } from '../utils/helper';
import { WarehouseEntity } from '../warehouse/warehouse.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InviteService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  async inviteWarehouseUser(email: string, warehouseId: string, role: string) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const warehouseRepo = this.txRepoProvider.getRepo(WarehouseEntity);
    const orgId: string = this.clsService.get('orgId');
    const warehouse = await warehouseRepo.findOne({
      where: { warehouseId, orgId },
    });
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found');
    }
    const rawToken = crypto.randomBytes(32).toString('hex');
    const invitationDurationHours =
      this.configService.get<number>('email.inviteTokenExpiresIn') || 24;
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
  async acceptInvite(rawToken: string, registerDto: RegisterDto) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const token = this.authService.hashToken(rawToken);
    const [invite]: InviteEntity[] = await this.txRepoProvider
      .getManager()
      .query<InviteEntity[]>(`SELECT * FROM consume_invite($1, $2)`, [
        token,
        true,
      ])
      .catch(() => {
        throw new BadRequestException('Invite invalid or expired');
      });
    const mappedInvite = mapRow(inviteRepo, invite);
    let user = await userRepo.findOne({
      where: { email: mappedInvite.email },
    });
    if (!user) {
      user = userRepo.create({
        email: mappedInvite.email,
        username: registerDto.username,
        password: await this.authService.hashPassword(registerDto.password),
      });
      await userRepo.save(user);
    }

    await this.txRepoProvider
      .getManager()
      .query(`SELECT grant_invite_role($1, $2, $3, $4)`, [
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
    const rawToken = crypto.randomBytes(32).toString('hex');
    const registerDurationMinutes =
      this.configService.get<number>('email.registerTokenExpiresIn') || 30;
    const expiresAt = new Date(
      Date.now() + registerDurationMinutes * 60 * 1000,
    );
    const token = this.authService.hashToken(rawToken);
    const [invite]: InviteEntity[] = await inviteRepo.query<InviteEntity[]>(
      `SELECT create_org_registration($1, $2, $3)`,
      [email, token, expiresAt],
    );
    return { invite: invite, rawToken: rawToken };
  }
}
