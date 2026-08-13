import { Body, Controller, Post, Res } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { OrganizationService } from './organization.service';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from './organization.entity';
import express from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserToken } from '../user/user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const cookie: UserToken = {
      username: user.username,
      userId: user.userId,
      orgId: organization.orgId,
      activeWarehouseId: '',
      activeRole: '',
    };
    const signedCookie = this.jwtService.sign(cookie);
    res.cookie('token', signedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: this.configService.get<number>('auth.jwtExpiresIn')! * 1000,
    });
    return { message: 'Organization created successfully.' };
    //TODO: Send E-Mail Authentication
  }
}
