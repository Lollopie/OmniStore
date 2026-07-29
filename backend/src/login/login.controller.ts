import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import express from 'express';
import { LoginService } from './login.service';
import { RegisterDto } from '@shared/dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() user: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<{
    message: string;
    warehouses: { warehouseId: string; name: string; role: string }[] | null;
    activeWarehouse: string | null;
    activeRole: string | null;
    userId: string;
    username: string;
  }> {
    const userInfo: {
      warehouses: { warehouseId: string; name: string; role: string }[] | null;
      userId: string;
      username: string;
    } = await this.loginService.login(user);
    const cookie = {
      userId: userInfo.userId,
      username: userInfo.username,
      activeWarehouseId:
        userInfo.warehouses && userInfo.warehouses[0]
          ? userInfo.warehouses[0].warehouseId
          : '',
      activeRole:
        userInfo.warehouses && userInfo.warehouses[0]
          ? userInfo.warehouses[0].role
          : '',
    };
    res.cookie('token', this.jwtService.sign(cookie), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: this.configService.get<number>('auth.jwtExpiresIn')! * 1000,
    });

    return {
      message: 'Authentication successful',
      warehouses: userInfo.warehouses,
      activeWarehouse:
        userInfo.warehouses && userInfo.warehouses[0]
          ? userInfo.warehouses[0].name
          : null,
      activeRole:
        userInfo.warehouses && userInfo.warehouses[0]
          ? userInfo.warehouses[0].role
          : null,
      userId: userInfo.userId,
      username: userInfo.username,
    };
  }
}
