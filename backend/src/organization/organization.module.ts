import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TxRepoProvider } from '../rls/txrepo.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { GuardDBService } from '../utils/guardDB.service';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PaymentModule],
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
