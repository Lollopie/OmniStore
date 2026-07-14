import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import {
  WarehouseDto,
  WarehouseIDDto,
  WarehouseUserRoleDto,
} from './warehouse.dto';
import { AuthGuard } from '../auth/auth.guard.js';
import * as userDecorator from '../user/user.decorator';
import express from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/roles.enum';

@Controller('warehouse')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
  ) {}
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() warehouseData: WarehouseDto,
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const response = await this.warehouseService.createWarehouse(
      warehouseData,
      userToken.user_id,
      'admin',
    );
    if (response) {
      const payload = {
        user_id: userToken.user_id,
        username: userToken.username,
        activeWarehouseId: response.warehouse_id,
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
      return response;
    }
    return { error: 'Creation failed' };
  }
  @Post('/select')
  @UseGuards(AuthGuard)
  async select(
    @Body() warehouseData: WarehouseIDDto,
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const response = await this.userWarehouseRoleService.findRole(
      userToken.user_id,
      warehouseData.id,
    );
    if (response) {
      const payload = {
        user_id: userToken.user_id,
        username: userToken.username,
        activeWarehouseId: response[0].warehouse_id,
        activeRole: response[0].role,
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
        activeRole: response[0].role,
      };
    }
    return { error: 'Selection failed' };
  }
  @Get('/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async get() {
    return await this.userWarehouseRoleService.getUsers();
  }

  @Post('/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async addUserToWarehouse(
    @Body() warehouseUserRoleData: WarehouseUserRoleDto,
  ) {
    return await this.userWarehouseRoleService.addUserToWarehouse(
      warehouseUserRoleData.username,
      warehouseUserRoleData.role,
    );
  }

  @Patch('/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateUserRole(@Body() warehouseUserRoleData: WarehouseUserRoleDto) {
    return await this.userWarehouseRoleService.updateUserRole(
      warehouseUserRoleData.username,
      warehouseUserRoleData.role,
    );
  }
}
