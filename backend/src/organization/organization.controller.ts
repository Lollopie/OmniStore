import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  OrganizationDto,
  OrganizationUpdateRoleDto,
} from '@shared/dto/organization.dto';
import { OrganizationService } from './organization.service';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from './organization.entity';
import express from 'express';
import * as userDecorator from '../user/user.decorator';
import { Cookie } from '../user/user.decorator';
import { AuthService } from '../auth/auth.service';
import { OrganizationRoles } from '../roles/organizationRoles/organizationRoles.decorator';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { AuthGuard } from '../auth/auth.guard';
import { OrganizationRolesGuard } from '../roles/organizationRoles/organizationRoles.guard';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';
import { SubscriptionGuard } from '../payment/subscription.guard';
import { SubscriptionService } from '../payment/subscription.service';
import { Throttle } from '@nestjs/throttler';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly authService: AuthService,
    private readonly userOrganizationRoleService: UserOrganizationRoleService,
    private readonly subscriptionService: SubscriptionService,
  ) {}
  /**
   * Returns the org's plan. When the user returns from Stripe Checkout, the
   * sessionId lets us confirm the purchase without waiting for the webhook.
   */
  @Get('/subscription')
  @UseGuards(AuthGuard)
  // Requested on every page load and polled after checkout, so the global limit
  // is too low; still limited because a sessionId triggers a Stripe API call
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async getSubscription(
    @userDecorator.User() user: Cookie,
    @Query('sessionId') sessionId?: string,
  ) {
    let subscription = await this.subscriptionService.getSubscription(
      user.orgId,
    );
    if (!subscription && sessionId) {
      if (
        await this.subscriptionService.confirmCheckoutSession(
          sessionId,
          user.orgId,
        )
      ) {
        subscription = await this.subscriptionService.getSubscription(
          user.orgId,
        );
      }
    }
    return { subscription };
  }
  @Post('/register')
  async register(
    @Query('token') token: string,
    @Body() data: OrganizationDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const {
      user,
      organization,
    }: { user: UserEntity; organization: OrganizationEntity } =
      await this.organizationService.createOrganization(token, data);
    const cookie: Cookie = {
      username: user.username,
      userId: user.userId,
      orgId: organization.orgId,
      activeWarehouseId: '',
      activeRole: '',
    };
    this.authService.createAndSendCookie(cookie, res);
    return { message: 'Organization created successfully.' };
  }
  @Get('/users')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  getUsers(@Query('search') searchTerm: string, @Query('page') page: number) {
    const search = searchTerm || '';
    const pageNumber = page || 1;
    return this.organizationService.getUsers(search, pageNumber);
  }
  @Patch('/users')
  @UseGuards(AuthGuard, SubscriptionGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async updateUserRole(
    @Body() organizationUpdateRoleData: OrganizationUpdateRoleDto,
  ) {
    return await this.userOrganizationRoleService.updateUserRole(
      organizationUpdateRoleData.username,
      organizationUpdateRoleData.role,
    );
  }
}
