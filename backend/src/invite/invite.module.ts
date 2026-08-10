import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { PasswordService } from '../auth/password.service';

@Module({
  imports: [],
  providers: [InviteService, PasswordService],
  controllers: [InviteController],
})
export class InviteModule {}
