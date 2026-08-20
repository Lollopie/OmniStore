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
import { Cookie } from '../user/user.decorator';
import { AuthService } from '../auth/auth.service';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly cookieService: AuthService,
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
    const userInfo = await this.loginService.login(user);
    const warehouses = userInfo.map((info) => ({
      warehouseId: info.warehouse_id,
      name: info.warehouse_name,
      role: info.warehouse_role,
    }));
    const activeWarehouse =
      warehouses && warehouses[0] ? warehouses[0].name : null;
    const activeRole = warehouses && warehouses[0] ? warehouses[0].role : null;
    const cookie: Cookie = {
      userId: userInfo[0].user_id,
      username: userInfo[0].username,
      orgId: userInfo[0].org_id,
      activeWarehouseId: activeWarehouse ? activeWarehouse : '',
      activeRole: activeRole ? activeRole : '',
    };
    this.cookieService.createAndSendCookie(cookie, res);

    return {
      message: 'Authentication successful',
      warehouses: warehouses,
      activeWarehouse: activeWarehouse,
      activeRole: activeRole,
      userId: userInfo[0].user_id,
      username: userInfo[0].username,
    };
  }
}
