import {
  Controller,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import express from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @Body() body: { userId: string; password: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { userId, password } = body;
    await this.usersService.deleteUser(userId, password);
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return { message: 'Account deleted successfully' };
  }
}
