import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { EntityManager } from 'typeorm';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { Cookie } from '../user/user.decorator';
import { GuardDBService } from '../utils/guardDB.service';
import { RevocationService } from './revocation.service';
import { ACCESS_COOKIE, REFRESH_COOKIE, sessionCookieOptions } from './cookies';

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Issues the short-lived access token together with a rotating refresh token,
 * and renews or ends sessions.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly guardDBService: GuardDBService,
    private readonly revocationService: RevocationService,
    private readonly clsService: ClsService,
  ) {}

  private get refreshExpiresIn(): number {
    return this.configService.get<number>('auth.refreshExpiresIn')!;
  }

  /** Sets the access token cookie. It outlives the token so refresh can read the active warehouse from it. */
  sendAccessToken(cookie: Cookie, res: Response) {
    const { userId, username, orgId, activeWarehouseId, activeRole } = cookie;
    const token = this.jwtService.sign({
      userId,
      username,
      orgId,
      activeWarehouseId,
      activeRole,
    });
    res.cookie(ACCESS_COOKIE, token, {
      ...sessionCookieOptions(),
      maxAge: this.refreshExpiresIn * 1000,
    });
  }

  private newRefreshToken() {
    const token = crypto.randomBytes(32).toString('hex');
    return {
      token,
      hash: hashToken(token),
      expiresAt: new Date(Date.now() + this.refreshExpiresIn * 1000),
    };
  }

  private sendRefreshToken(token: string, res: Response) {
    res.cookie(REFRESH_COOKIE, token, {
      ...sessionCookieOptions(),
      maxAge: this.refreshExpiresIn * 1000,
    });
  }

  /** Starts a session after login or registration. */
  async issueSession(cookie: Cookie, res: Response) {
    const refresh = this.newRefreshToken();
    // Inside the request transaction, so a user created by this request is visible
    // and the token is rolled back with it
    await this.guardDBService.createRefreshToken(
      cookie.userId,
      refresh.hash,
      refresh.expiresAt,
      this.clsService.get<EntityManager | undefined>('entityManager'),
    );
    this.sendAccessToken(cookie, res);
    this.sendRefreshToken(refresh.token, res);
  }

  /**
   * Swaps the refresh token for a new one and issues a fresh access token whose
   * claims are rebuilt from the database, so removed users cannot refresh.
   */
  async refresh(req: Request, res: Response) {
    const presented: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof presented !== 'string' || !presented) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const refresh = this.newRefreshToken();
    const rotated = await this.guardDBService.rotateRefreshToken(
      hashToken(presented),
      refresh.hash,
      refresh.expiresAt,
    );
    if (rotated?.reused) {
      // A rotated token came back: it may have been stolen, so end every session of the user
      await this.guardDBService.revokeUserRefreshTokens(rotated.userId);
      await this.revocationService.revokeUser(rotated.userId);
    }
    const session =
      rotated && !rotated.reused
        ? await this.guardDBService.getUserSession(rotated.userId)
        : null;
    if (!rotated || !session) {
      this.clearSession(res);
      throw new UnauthorizedException('Invalid refresh token');
    }
    const { activeWarehouseId, activeRole } = await this.findActiveWarehouse(
      req,
      rotated.userId,
    );
    this.sendAccessToken(
      {
        userId: rotated.userId,
        username: session.username,
        orgId: session.orgId,
        activeWarehouseId,
        activeRole,
      },
      res,
    );
    this.sendRefreshToken(refresh.token, res);
  }

  /** Keeps the previously active warehouse if the user still has a role in it. */
  private async findActiveWarehouse(
    req: Request,
    userId: string,
  ): Promise<{ activeWarehouseId: string; activeRole: string }> {
    const none = { activeWarehouseId: '', activeRole: '' };
    const accessToken: unknown = req.cookies?.[ACCESS_COOKIE];
    if (typeof accessToken !== 'string' || !accessToken) {
      return none;
    }
    let previous: Cookie;
    try {
      previous = await this.jwtService.verifyAsync<Cookie>(accessToken, {
        ignoreExpiration: true,
      });
    } catch {
      return none;
    }
    if (previous.userId !== userId || !previous.activeWarehouseId) {
      return none;
    }
    const role = await this.guardDBService.getUserWarehouseRole(
      userId,
      previous.activeWarehouseId,
    );
    return role
      ? { activeWarehouseId: previous.activeWarehouseId, activeRole: role }
      : none;
  }

  /** Ends this device's session, e.g. on logout. */
  async endSession(req: Request, res: Response) {
    const presented: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof presented === 'string' && presented) {
      await this.guardDBService.deleteRefreshToken(hashToken(presented));
    }
    this.clearSession(res);
  }

  clearSession(res: Response) {
    res.clearCookie(ACCESS_COOKIE, sessionCookieOptions());
    res.clearCookie(REFRESH_COOKIE, sessionCookieOptions());
  }
}
