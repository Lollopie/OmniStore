import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../user/user.decorator';
import { GuardDBService } from '../utils/guardDB.service';

/**
 * Blocks write requests for organizations without an active subscription.
 * Must run after AuthGuard so that request.user is populated.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly guardDBService: GuardDBService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const orgId = request.user?.orgId;
    if (!orgId || !(await this.guardDBService.getOrgSubscription(orgId))) {
      throw new ForbiddenException(
        'An active subscription is required to perform this action',
      );
    }
    return true;
  }
}
