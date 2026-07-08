import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseDto } from './warehouse.dto';
import { AuthGuard } from '../auth/auth.guard.js';
import * as userDecorator from '../user/user.decorator';
import express from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('warehouse')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      return { success: true };
    }
    return { error: 'Creation failed' };
  }
}
