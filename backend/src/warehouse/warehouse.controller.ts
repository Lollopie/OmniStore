import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import {
  WarehouseDto,
  WarehouseIDDto,
  WarehouseUserRoleDto,
} from '@shared/dto/warehouse.dto';
import { AuthGuard } from '../auth/auth.guard';
import * as userDecorator from '../user/user.decorator';
import express from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';
import { WarehouseRolesGuard } from '../roles/warehouseRoles/warehouseRoles.guard';
import { WarehouseRoles } from '../roles/warehouseRoles/warehouseRoles.decorator';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { OrganizationRoles } from '../roles/organizationRoles/organizationRoles.decorator';
import { OrganizationRolesGuard } from '../roles/organizationRoles/organizationRoles.guard';
import { InviteService } from '../invite/invite.service';
import { ClsService } from 'nestjs-cls';
import { Cookie } from '../user/user.decorator';
import { CookieService } from '../auth/cookie.service';

@Controller('warehouses')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
    private readonly inviteService: InviteService,
    private readonly clsService: ClsService,
    private readonly cookieService: CookieService,
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
  @UseGuards(AuthGuard, WarehouseRolesGuard, OrganizationRolesGuard)
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

  @Post('/invite')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async inviteUser(@Body() warehouseUserRoleData: WarehouseUserRoleDto) {
    const invite = await this.inviteService.inviteWarehouseUser(
      warehouseUserRoleData.email,
      warehouseUserRoleData.warehouseId,
      warehouseUserRoleData.role,
    );
    if (invite) {
      return { message: 'Invite send successfully.' };
    }
    throw new InternalServerErrorException('Invalid invite');
  }
}
