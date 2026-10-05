import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  DeleteOrganizationDto,
  OrganizationDto,
  OrganizationInviteDto,
  OrganizationUpdateRoleDto,
  UpdateOrganizationDto,
} from '@shared/dto/organization.dto';
import { OrganizationService } from './organization.service';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from './organization.entity';
import express from 'express';
import * as userDecorator from '../user/user.decorator';
import { Cookie } from '../user/user.decorator';
import { SessionService } from '../auth/session.service';
import { RevocationService } from '../auth/revocation.service';
import { OrganizationRoles } from '../roles/organizationRoles/organizationRoles.decorator';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { AuthGuard } from '../auth/auth.guard';
import { OrganizationRolesGuard } from '../roles/organizationRoles/organizationRoles.guard';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';
import { SubscriptionGuard } from '../payment/subscription.guard';
import { SubscriptionService } from '../payment/subscription.service';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { InviteService } from '../invite/invite.service';
import { InviteEntity } from '../invite/invite.entity';
import { MailService } from '../mail/mail.service';
import { InviteContext } from '../mail/interfaces/mail-contexts.interface';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly sessionService: SessionService,
    private readonly revocationService: RevocationService,
    private readonly userOrganizationRoleService: UserOrganizationRoleService,
    private readonly subscriptionService: SubscriptionService,
    private readonly inviteService: InviteService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
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
  @Get('/me')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  async getOrganization() {
    const org = await this.organizationService.getCurrentOrganization();
    return {
      orgId: org.orgId,
      name: org.name,
      createdAt: org.createdAt,
      subscription: org.subscription,
    };
  }
  @Patch()
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async renameOrganization(@Body() data: UpdateOrganizationDto) {
    const org = await this.organizationService.renameOrganization(data.name);
    return { orgId: org.orgId, name: org.name };
  }
  @Delete()
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER)
  async deleteOrganization(
    @Body() data: DeleteOrganizationDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { stripeSubscriptionId, memberIds } =
      await this.organizationService.deleteOrganization(data.confirmName);
    // Runs inside the request transaction, so a Stripe failure rolls back the deletion
    if (stripeSubscriptionId) {
      await this.subscriptionService.cancelSubscription(stripeSubscriptionId);
    }
    // Members' access tokens would otherwise stay valid until they expire
    await Promise.all(
      memberIds.map((memberId) => this.revocationService.revokeUser(memberId)),
    );
    this.sessionService.clearSession(res);
    return { message: 'Organization deleted.' };
  }
  @Get('/billing')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async getBilling() {
    const org = await this.organizationService.getCurrentOrganization();
    // Plans granted without Stripe (e.g. seeded orgs) have nothing to manage
    if (!org.stripeSubscriptionId) {
      return {
        plan: org.subscription,
        manageable: false,
        status: null,
        currentPeriodEnd: null,
        cancelAt: null,
      };
    }
    return {
      plan: org.subscription,
      manageable: true,
      ...(await this.subscriptionService.getBillingDetails(
        org.stripeSubscriptionId,
      )),
    };
  }
  @Post('/billing/portal')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER)
  async createBillingPortalSession() {
    const org = await this.organizationService.getCurrentOrganization();
    if (!org.stripeSubscriptionId) {
      throw new BadRequestException(
        'Your organization has no subscription to manage',
      );
    }
    const url = await this.subscriptionService.createPortalSession(
      org.stripeSubscriptionId,
      `${this.configService.get<string>('app.frontendUrl')}/organizations/billing`,
    );
    return { url };
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
    await this.sessionService.issueSession(cookie, res);
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
  @Delete('/users/:userId')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async removeUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @userDecorator.User() user: Cookie,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.userOrganizationRoleService.removeMember(userId);
    // Their refresh tokens cascade with the account; this ends their access tokens
    await this.revocationService.revokeUser(userId);
    if (userId === user.userId) {
      this.sessionService.clearSession(res);
    }
    return { message: 'User removed from organization.' };
  }
  @Get('/invites')
  @UseGuards(AuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async getInvites() {
    return await this.inviteService.getPendingInvites();
  }
  @Post('/invites')
  @UseGuards(AuthGuard, SubscriptionGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async inviteUser(
    @Body() organizationInviteData: OrganizationInviteDto,
    @userDecorator.User() user: Cookie,
  ) {
    const { invite, rawToken } =
      await this.inviteService.inviteOrganizationUser(
        organizationInviteData.email,
        organizationInviteData.role,
      );
    await this.sendInviteEmail(invite, rawToken, user.orgId);
    return { message: 'Invite sent successfully.' };
  }
  @Post('/invites/:inviteId/resend')
  @UseGuards(AuthGuard, SubscriptionGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async resendInvite(
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
    @userDecorator.User() user: Cookie,
  ) {
    const { invite, rawToken } =
      await this.inviteService.resendInvite(inviteId);
    await this.sendInviteEmail(invite, rawToken, user.orgId);
    return { message: 'Invite sent successfully.' };
  }
  @Delete('/invites/:inviteId')
  @UseGuards(AuthGuard, SubscriptionGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.ADMIN)
  async revokeInvite(@Param('inviteId', ParseUUIDPipe) inviteId: string) {
    await this.inviteService.revokeInvite(inviteId);
    return { message: 'Invite revoked.' };
  }
  private async sendInviteEmail(
    invite: InviteEntity,
    rawToken: string,
    orgId: string,
  ) {
    const org = await this.organizationService.findByOrgId(orgId);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    const context: InviteContext = {
      organizationName: org.name,
      verificationUrl: `${this.configService.get('app.frontendUrl')}/invites/accept?token=${rawToken}`,
      expiresInHours:
        this.configService.get('email.inviteTokenExpiresHours') || 24,
    };
    await this.mailService.sendInviteEmail(invite.email, context);
  }
}
