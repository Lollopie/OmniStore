import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type RevocationStatus = 'revoked' | 'ok' | 'unknown';

const keyFor = (userId: string) => `auth:revoked:${userId}`;

/**
 * Remembers users whose sessions ended before their access tokens expired, e.g.
 * removed members. Entries live as long as an access token, so AuthGuard can
 * check Redis instead of querying Postgres on every request.
 */
@Injectable()
export class RevocationService implements OnModuleDestroy {
  private readonly logger = new Logger(RevocationService.name);
  private readonly redis: Redis;
  private readonly ttlSeconds: number;
  // Logs an outage once instead of on every request
  private reportedOutage = false;

  constructor(configService: ConfigService) {
    this.ttlSeconds = configService.get<number>('auth.jwtExpiresIn')!;
    this.redis = new Redis(configService.get<string>('db.redisUrl')!, {
      // Fail fast while Redis is down, so AuthGuard falls back to Postgres
      enableOfflineQueue: false,
      commandTimeout: 200,
      maxRetriesPerRequest: 1,
    });
    this.redis.on('error', (err: Error) => this.reportOutage(err));
  }

  /** Invalidates every access token issued to the user up to now. */
  async revokeUser(userId: string): Promise<void> {
    try {
      await this.redis.set(
        keyFor(userId),
        Math.floor(Date.now() / 1000).toString(),
        'EX',
        this.ttlSeconds,
      );
    } catch (err) {
      // Not fatal: the Postgres fallback and the short token lifetime still apply
      this.logger.error(
        `Failed to revoke sessions of user ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /** 'unknown' means Redis could not answer and the caller must check the database. */
  async check(
    userId: string,
    issuedAt: number | undefined,
  ): Promise<RevocationStatus> {
    try {
      const revokedAt = await this.redis.get(keyFor(userId));
      this.reportedOutage = false;
      if (revokedAt === null) {
        return 'ok';
      }
      return issuedAt === undefined || issuedAt <= Number(revokedAt)
        ? 'revoked'
        : 'ok';
    } catch (err) {
      this.reportOutage(err as Error);
      return 'unknown';
    }
  }

  private reportOutage(err: Error) {
    if (!this.reportedOutage) {
      this.reportedOutage = true;
      this.logger.warn(
        `Redis unavailable, checking sessions against the database: ${err.message}`,
      );
    }
  }

  async onModuleDestroy() {
    this.redis.disconnect();
  }
}
