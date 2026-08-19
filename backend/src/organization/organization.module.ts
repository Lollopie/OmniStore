import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TxRepoProvider } from '../rls/db.helper';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [],
  providers: [OrganizationService, AuthService, TxRepoProvider, MailService],
  exports: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
