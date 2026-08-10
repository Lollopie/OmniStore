import { Body, Controller, Param, Post } from '@nestjs/common';
import { InviteService } from './invite.service';
import { RegisterDto } from '@shared';

@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}
  @Post('/:inviteToken')
  async acceptInvite(
    @Param('inviteToken') inviteToken: string,
    @Body() registerDto: RegisterDto,
  ) {
    return await this.inviteService.acceptInvite(inviteToken, registerDto);
  }
}
