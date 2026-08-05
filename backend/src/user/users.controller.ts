import {
  Controller,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import express from 'express';
import { ChangePasswordDto } from '@shared/dto/changePassword.dto';
import * as userDecorator from './user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(AuthGuard)
  @Patch()
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body() body: ChangePasswordDto,
    @userDecorator.User() userToken: userDecorator.UserToken,
  ) {
    await this.usersService.updatePassword(userToken.userId, body);
    return { message: 'Password updated successfully' };
  }
  @UseGuards(AuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @Body() body: { password: string },
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { password } = body;
    await this.usersService.deleteUser(userToken.userId, password);
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { message: 'Account deleted successfully' };
  }
}
