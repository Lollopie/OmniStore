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
    orgId: string;
    orgRole: string;
    warehouses: { warehouseId: string; name: string; role: string }[] | null;
    activeWarehouse: string | null;
    activeRole: string | null;
    userId: string;
    username: string;
  }> {
    const userInfo = await this.loginService.login(user);
    const warehouses = userInfo
      .map((info) => ({
        warehouseId: info.warehouse_id,
        name: info.warehouse_name,
        role: info.warehouse_role,
      }))
      .filter(
        (info) =>
          info.warehouseId !== null && info.name !== null && info.role !== null,
      );
    const activeWarehouseId =
      warehouses && warehouses[0] ? warehouses[0].warehouseId : null;
    const activeRole = warehouses && warehouses[0] ? warehouses[0].role : null;
    const cookie: Cookie = {
      userId: userInfo[0].user_id,
      username: userInfo[0].username,
      orgId: userInfo[0].org_id,
      activeWarehouseId: activeWarehouseId ? activeWarehouseId : '',
      activeRole: activeRole ? activeRole : '',
    };
    this.cookieService.createAndSendCookie(cookie, res);

    return {
      message: 'Authentication successful',
      orgId: userInfo[0].org_id,
      orgRole: userInfo[0].org_role,
      warehouses: warehouses,
      activeWarehouse: activeWarehouseId,
      activeRole: activeRole,
      userId: userInfo[0].user_id,
      username: userInfo[0].username,
    };
  }
}
