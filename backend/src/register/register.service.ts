import { Injectable } from '@nestjs/common';
import { RegisterEmailDto } from '@shared/dto/register.dto';
import { InviteService } from '../invite/invite.service';
import { InviteEntity } from '../invite/invite.entity';
@Injectable()
export class RegisterService {
  constructor(private readonly inviteService: InviteService) {}
  async register(
    registerData: RegisterEmailDto,
  ): Promise<{ invite: InviteEntity; rawToken: string } | null> {
    return await this.inviteService.inviteOrganizationRegister(
      registerData.email,
    );
  }
  async verifyToken(inviteToken: string): Promise<InviteEntity | null> {
    return await this.inviteService.validateInvite(inviteToken);
  }
}
