import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PasswordService } from '../auth/password.service';

@Module({
  imports: [],
  providers: [OrganizationService, PasswordService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
