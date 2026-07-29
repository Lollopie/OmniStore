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
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@shared/enum/roles.enum';

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
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async get(@Query('search') searchTerm: string, @Query('page') page: number) {
    const limit = 10;
    return await this.userWarehouseRoleService.getUsers(
      page,
      limit,
      searchTerm,
    );
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
