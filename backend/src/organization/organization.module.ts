import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TxRepoProvider } from '../rls/db.helper';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { GuardDBService } from '../utils/guardDB.service';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';

@Module({
  imports: [],
  providers: [
    OrganizationService,
    AuthService,
    TxRepoProvider,
    MailService,
    GuardDBService,
    UserOrganizationRoleService,
  ],
  exports: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
