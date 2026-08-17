import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PasswordService } from '../auth/password.service';
import { TxRepoProvider } from '../rls/db.helper';
import { CookieService } from '../auth/cookie.service';

@Module({
  imports: [],
  providers: [
    OrganizationService,
    PasswordService,
    TxRepoProvider,
    CookieService,
  ],
  exports: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
