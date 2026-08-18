import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TxRepoProvider } from '../rls/db.helper';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [],
  providers: [OrganizationService, AuthService, TxRepoProvider],
  exports: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
