import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import {
  WarehouseDto,
  WarehouseIDDto,
  WarehouseInviteDto,
  WarehouseUserRoleDto,
} from '@shared/dto/warehouse.dto';
import { AuthGuard } from '../auth/auth.guard';
import * as userDecorator from '../user/user.decorator';
import express from 'express';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';
import { WarehouseRolesGuard } from '../roles/warehouseRoles/warehouseRoles.guard';
import { WarehouseRoles } from '../roles/warehouseRoles/warehouseRoles.decorator';
import {
  ORG_WAREHOUSE_INVITATION_PERMISSIONS,
  WAREHOUSE_INVITATION_PERMISSIONS,
  WarehouseRole,
} from '@shared/enum/warehouseRoles.enum';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { OrganizationRoles } from '../roles/organizationRoles/organizationRoles.decorator';
import { OrganizationRolesGuard } from '../roles/organizationRoles/organizationRoles.guard';
import { InviteService } from '../invite/invite.service';
import { ClsService } from 'nestjs-cls';
import { Cookie } from '../user/user.decorator';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { InviteContext } from '../mail/interfaces/mail-contexts.interface';
import { ConfigService } from '@nestjs/config';
import { InviteEntity } from '../invite/invite.entity';
import { OrganizationService } from '../organization/organization.service';

@Controller('warehouses')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
    private readonly inviteService: InviteService,
    private readonly clsService: ClsService,
    private readonly cookieService: AuthService,
    private readonly orgService: OrganizationService,
  ) {}
  @Post()
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async create(
    @Body() warehouseData: WarehouseDto,
    @userDecorator.User() userToken: userDecorator.Cookie,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const warehouse = await this.warehouseService.createWarehouse(
      warehouseData,
      userToken.userId,
      'admin',
    );
    if (warehouse) {
      const cookie = {
        userId: userToken.userId,
        username: userToken.username,
        orgId: this.clsService.get<string>('orgId'),
        activeWarehouseId: warehouse.warehouseId,
        activeRole: 'admin',
      };
      this.cookieService.createAndSendCookie(cookie, res);
      const response: { name: string; warehouseId: string; role: string } = {
        name: warehouse.name,
        warehouseId: warehouse.warehouseId,
        role: 'admin',
      };
      return response;
    }
    return { error: 'Creation failed' };
  }
  @Post('/select')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MEMBER,
  )
  async select(
    @Body() warehouseData: WarehouseIDDto,
    @userDecorator.User() userToken: userDecorator.Cookie,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const response = await this.userWarehouseRoleService.findRole(
      userToken.userId,
      warehouseData.warehouseId,
    );
    if (response) {
      const cookie: Cookie = {
        userId: userToken.userId,
        username: userToken.username,
        orgId: this.clsService.get<string>('orgId'),
        activeWarehouseId: response.warehouseId,
        activeRole: response.role,
      };
      this.cookieService.createAndSendCookie(cookie, res);
      return {
        activeRole: response.role,
      };
    }
    return { error: 'Selection failed' };
  }
  @Get('/users')
  @UseGuards(AuthGuard, OrganizationRolesGuard, WarehouseRolesGuard)
  @OrganizationRoles(
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MEMBER,
  )
  @WarehouseRoles(WarehouseRole.ADMIN, WarehouseRole.MANAGER)
  async get(@Query('search') searchTerm: string, @Query('page') page: number) {
    const limit = 10;
    return await this.userWarehouseRoleService.getUsers(
      page,
      limit,
      searchTerm,
    );
  }

  @Post('/invites')
  @UseGuards(AuthGuard, OrganizationRolesGuard, WarehouseRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  @WarehouseRoles(WarehouseRole.ADMIN, WarehouseRole.MANAGER)
  async inviteUser(@Body() warehouseInviteData: WarehouseInviteDto) {
    const warehouseRole: WarehouseRole =
      this.clsService.get<WarehouseRole>('warehouseRole');
    const orgRole: OrganizationRole =
      this.clsService.get<OrganizationRole>('orgRole');
    const allowedRoles = [
      ...(WAREHOUSE_INVITATION_PERMISSIONS[warehouseRole] || []),
      ...(ORG_WAREHOUSE_INVITATION_PERMISSIONS[orgRole] || []),
    ];
    if (!allowedRoles.includes(warehouseInviteData.role)) {
      throw new ForbiddenException(
        'You do not have permission to invite users with this role',
      );
    }
    const invite: { invite: InviteEntity; rawToken: string } =
      await this.inviteService.inviteWarehouseUser(
        warehouseInviteData.email,
        warehouseInviteData.role,
      );
    if (invite) {
      const context: InviteContext = {
        organizationName:
          (await this.orgService.findOne(invite.invite.orgId))?.name ||
          'Organization',
        verificationUrl: `${this.configService.get('app.frontendUrl')}/invites/accept?token=${invite.rawToken}`,
        expiresInHours:
          this.configService.get('email.inviteTokenExpiresIn') || 24,
      };
      await this.mailService.sendInviteEmail(invite.invite.email, context);
      return { message: 'Invite sent successfully.' };
    }
    throw new ForbiddenException('Invalid invite');
  }
  @Patch('/users')
  @UseGuards(AuthGuard, WarehouseRolesGuard)
  @WarehouseRoles(WarehouseRole.ADMIN)
  async updateUserRole(@Body() warehouseUserRoleData: WarehouseUserRoleDto) {
    return await this.userWarehouseRoleService.updateUserRole(
      warehouseUserRoleData.username,
      warehouseUserRoleData.role,
    );
  }
}
