import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { PasswordService } from '../auth/password.service';
import { TxRepoProvider } from '../rls/db.helper';

@Module({
  imports: [],
  providers: [InviteService, PasswordService, TxRepoProvider],
  exports: [InviteService],
  controllers: [InviteController],
})
export class InviteModule {}
