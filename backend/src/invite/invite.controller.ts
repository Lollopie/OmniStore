import {
  Body,
  Controller,
  Query,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { RegisterDto } from '@shared/dto/register.dto';

@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}
  @Post('accept')
  async acceptInvite(
    @Query('token') inviteToken: string,
    @Body() registerDto: RegisterDto,
  ) {
    if (!inviteToken) {
      throw new BadRequestException('Invite token is required');
    }
    const result = await this.inviteService.acceptInvite(
      inviteToken,
      registerDto,
    );
    if (result) {
      return { message: 'Invite accepted successfully' };
    }
    return { error: 'Failed to accept invite' };
  }
}
