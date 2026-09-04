import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { TxRepoProvider } from '../rls/db.helper';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [],
  providers: [InviteService, AuthService, TxRepoProvider],
  exports: [InviteService],
  controllers: [InviteController],
})
export class InviteModule {}
