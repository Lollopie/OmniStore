import { BadRequestException, Injectable } from '@nestjs/common';
import { TxRepoProvider } from '../rls/db.helper';
import { InviteEntity } from './invite.entity';
import { ClsService } from 'nestjs-cls';
import * as crypto from 'crypto';
import { RegisterDto } from '@shared';
import { UserEntity } from '../user/user.entity';
import { PasswordService } from '../auth/password.service';
import { UserOrganizationRoleEntity } from '../userOrganizationRole/userOrganizationRole.entity';
import { UserWarehouseRoleEntity } from '../userWarehouseRole/userWarehouseRole.entity';
import { IsNull } from 'typeorm';

@Injectable()
export class InviteService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly clsService: ClsService,
    private readonly passwordService: PasswordService,
  ) {}
  async inviteWarehouseUser(email: string, warehouseId: string, role: string) {
    const repo = this.txRepoProvider.getRepo(InviteEntity);
    const orgId: string = this.clsService.get('orgId');
    const tokenHash = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    const invitationDurationDays = 7;
    expiresAt.setDate(expiresAt.getDate() + invitationDurationDays);
    const invite = repo.create({
      email,
      orgId,
      warehouseId,
      role,
      expiresAt,
      tokenHash,
    });
    //TODO: send invite E-Mail
    return await repo.save(invite);
  }
  async acceptInvite(token: string, registerDto: RegisterDto) {
    const inviteRepo = this.txRepoProvider.getRepo(InviteEntity);
    const userRepo = this.txRepoProvider.getRepo(UserEntity);
    const userOrgRoleRepo = this.txRepoProvider.getRepo(
      UserOrganizationRoleEntity,
    );
    const userWarehouseRoleRepo = this.txRepoProvider.getRepo(
      UserWarehouseRoleEntity,
    );

    const invite = await inviteRepo.findOne({
      where: { tokenHash: token, consumedAt: IsNull() },
      lock: { mode: 'pessimistic_write' },
    });
    if (!invite || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite invalid or expired');
    }

    await inviteRepo.update(
      { inviteId: invite.inviteId, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );

    let user = await userRepo.findOne({
      where: { email: invite.email },
    });
    if (!user) {
      user = userRepo.create({
        email: invite.email,
        username: registerDto.username,
        password: await this.passwordService.hashPassword(registerDto.password),
      });
      await userRepo.save(user);
    }

    await userOrgRoleRepo
      .createQueryBuilder()
      .insert()
      .values({ userId: user.userId, orgId: invite.orgId, role: 'MEMBER' })
      .orIgnore()
      .execute();

    if (invite.warehouseId && invite.role) {
      await userWarehouseRoleRepo
        .createQueryBuilder()
        .insert()
        .values({
          userId: user.userId,
          warehouseId: invite.warehouseId,
          role: invite.role,
        })
        .orUpdate(['role'], ['user_id', 'warehouse_id'])
        .execute();
    }

    return user;
  }
}
