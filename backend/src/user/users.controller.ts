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
import { SessionService } from '../auth/session.service';
import { RevocationService } from '../auth/revocation.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    private readonly revocationService: RevocationService,
  ) {}
  @UseGuards(AuthGuard)
  @Patch()
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body() body: ChangePasswordDto,
    @userDecorator.User() userToken: userDecorator.Cookie,
  ) {
    await this.usersService.updatePassword(userToken.userId, body);
    return { message: 'Password updated successfully' };
  }
  @UseGuards(AuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @Body() body: { password: string },
    @userDecorator.User() userToken: userDecorator.Cookie,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { password } = body;
    await this.usersService.deleteUser(
      userToken.userId,
      password,
      userToken.orgId,
    );
    // Ends the account's sessions on other devices too
    await this.revocationService.revokeUser(userToken.userId);
    this.sessionService.clearSession(res);

    return { message: 'Account deleted successfully' };
  }
}
