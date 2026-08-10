import {
  Body,
  Controller,
  Get,
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

@Controller('warehouses')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
    private readonly inviteService: InviteService,
  ) {}
  @Post()
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async create(
    @Body() warehouseData: WarehouseDto,
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const warehouse = await this.warehouseService.createWarehouse(
      warehouseData,
      userToken.userId,
      'admin',
    );
    if (warehouse) {
      const payload = {
        userId: userToken.userId,
        username: userToken.username,
        activeWarehouseId: warehouse.warehouseId,
        activeRole: 'admin',
      };
      const token = {
        Authorization: await this.jwtService.signAsync(payload),
      };
      res.cookie('token', token.Authorization, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: this.configService.get<number>('auth.jwtExpiresIn')! * 1000,
      });
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
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const response = await this.userWarehouseRoleService.findRole(
      userToken.userId,
      warehouseData.warehouseId,
    );
    if (response) {
      const payload = {
        userId: userToken.userId,
        username: userToken.username,
        activeWarehouseId: response.warehouseId,
        activeRole: response.role,
      };
      const token = {
        Authorization: await this.jwtService.signAsync(payload),
      };
      res.cookie('token', token.Authorization, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: this.configService.get<number>('auth.jwtExpiresIn')! * 1000,
      });
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
    return await this.inviteService.inviteWarehouseUser(
      warehouseUserRoleData.email,
      warehouseUserRoleData.warehouseId,
      warehouseUserRoleData.role,
    );
  }
}
