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
import { Cookie } from '../user/user.decorator';
import { CookieService } from '../auth/cookie.service';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly configService: ConfigService,
    private readonly cookieService: CookieService,
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
      orgId: string;
      userId: string;
      username: string;
    } = await this.loginService.login(user);
    const cookie: Cookie = {
      userId: userInfo.userId,
      username: userInfo.username,
      orgId: userInfo.userId,
      activeWarehouseId:
        userInfo.warehouses && userInfo.warehouses[0]
          ? userInfo.warehouses[0].warehouseId
          : '',
      activeRole:
        userInfo.warehouses && userInfo.warehouses[0]
          ? userInfo.warehouses[0].role
          : '',
    };
    this.cookieService.createAndSendCookie(cookie, res);

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
