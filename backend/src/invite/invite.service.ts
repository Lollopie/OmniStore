import { BadRequestException, Injectable } from '@nestjs/common';
import { TxRepoProvider } from '../rls/db.helper';
import { InviteEntity } from './invite.entity';
import { ClsService } from 'nestjs-cls';
import * as crypto from 'crypto';
import { RegisterDto } from '@shared/dto/register.dto';
import { UserEntity } from '../user/user.entity';
import { AuthService } from '../auth/auth.service';
import { mapRow } from '../utils/helper';

@Injectable()
export class InviteService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
    private readonly authService: AuthService,
  ) {}
  async inviteWarehouseUser(email: string, warehouseId: string, role: string) {
    const repo = this.txRepoProvider.getRepo(InviteEntity);
    const orgId: string = this.clsService.get('orgId');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    const invitationDurationDays = 7;
    expiresAt.setDate(expiresAt.getDate() + invitationDurationDays);
    const token = this.authService.hashToken(rawToken);
    await repo.query(`SELECT set_config('app.current_token_hash', $1, true)`, [
      token,
    ]);
    const invite = repo.create({
      email,
      orgId,
      warehouseId,
      role,
      expiresAt,
      tokenHash: token,
    });
    return { invite: await repo.save(invite), rawToken: rawToken };
  }
  async acceptInvite(rawToken: string, registerDto: RegisterDto) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const token = this.authService.hashToken(rawToken);
    const [invite]: InviteEntity[] = await this.txRepoProvider
      .getManager()
      .query<InviteEntity[]>(`SELECT * FROM consume_invite($1)`, [token])
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
}
