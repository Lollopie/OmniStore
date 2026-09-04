import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  OrganizationDto,
  OrganizationUpdateRoleDto,
} from '@shared/dto/organization.dto';
import { OrganizationService } from './organization.service';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from './organization.entity';
import express from 'express';
import { Cookie } from '../user/user.decorator';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { OrganizationRoles } from '../roles/organizationRoles/organizationRoles.decorator';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { AuthGuard } from '../auth/auth.guard';
import { OrganizationRolesGuard } from '../roles/organizationRoles/organizationRoles.guard';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly userOrganizationRoleService: UserOrganizationRoleService,
  ) {}
  @Post('/register')
  async register(
    @Query('token') token: string,
    @Body() data: OrganizationDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const {
      user,
      organization,
    }: { user: UserEntity; organization: OrganizationEntity } =
      await this.organizationService.createOrganization(token, data);
    const cookie: Cookie = {
      username: user.username,
      userId: user.userId,
      orgId: organization.orgId,
      activeWarehouseId: '',
      activeRole: '',
    };
    this.authService.createAndSendCookie(cookie, res);
    return { message: 'Organization created successfully.' };
    //TODO: Send E-Mail Authentication
  }
  @Get('/users')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  getUsers(@Query('search') searchTerm: string, @Query('page') page: number) {
    const search = searchTerm || '';
    const pageNumber = page || 1;
    return this.organizationService.getUsers(search, pageNumber);
  }
  @Patch('/users')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async updateUserRole(
    @Body() organizationUpdateRoleData: OrganizationUpdateRoleDto,
  ) {
    return await this.userOrganizationRoleService.updateUserRole(
      organizationUpdateRoleData.username,
      organizationUpdateRoleData.role,
    );
  }
}
