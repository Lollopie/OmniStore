import { Body, Controller, Post, Res } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { OrganizationService } from './organization.service';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from './organization.entity';
import express from 'express';
import { Cookie } from '../user/user.decorator';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
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
    this.authService.createAndSendCookie(cookie, res);
    return { message: 'Organization created successfully.' };
    //TODO: Send E-Mail Authentication
  }
}
