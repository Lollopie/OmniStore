import { Body, Controller, Post, Res } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { OrganizationService } from './organization.service';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from './organization.entity';
import express from 'express';
import { JwtService } from '@nestjs/jwt';
import { Cookie } from '../user/user.decorator';
import { ConfigService } from '@nestjs/config';
import { CookieService } from '../auth/cookie.service';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cookieService: CookieService,
  ) {}
  @Post('/register')
  async register(
    @Body() data: OrganizationDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const {
      user,
      organization,
    }: { user: UserEntity; organization: OrganizationEntity } =
      await this.organizationService.createOrganization(data);
    const cookie: Cookie = {
      username: user.username,
      userId: user.userId,
      orgId: organization.orgId,
      activeWarehouseId: '',
      activeRole: '',
    };
    this.cookieService.createAndSendCookie(cookie, res);
    return { message: 'Organization created successfully.' };
    //TODO: Send E-Mail Authentication
  }
}
