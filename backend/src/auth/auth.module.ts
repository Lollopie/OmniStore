import { Global, Module } from '@nestjs/common';
import { GuardDBService } from '../utils/guardDB.service';
import { RevocationService } from './revocation.service';
import { SessionService } from './session.service';

// Global, so AuthGuard and the controllers that issue or end sessions can use it in every module
@Global()
@Module({
  providers: [GuardDBService, RevocationService, SessionService],
  exports: [RevocationService, SessionService],
})
export class AuthModule {}
