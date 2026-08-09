import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { firstValueFrom, from, Observable } from 'rxjs';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return from(
      this.dataSource.transaction(async (manager) => {
        const userId: string = this.cls.get('userId');
        const orgId: string = this.cls.get('orgId');
        const warehouseId: string = this.cls.get('warehouseId');

        if (userId) {
          await manager.query(
            `SELECT set_config('app.current_user_id', $1, true)`,
            [userId],
          );
        }
        if (orgId) {
          await manager.query(
            `SELECT set_config('app.current_org_id', $1, true)`,
            [orgId],
          );
        }
        if (warehouseId) {
          await manager.query(
            `SELECT set_config('app.current_warehouse_id', $1, true)`,
            [warehouseId],
          );
        }

        this.cls.set('entityManager', manager);
        const result: unknown = await firstValueFrom(next.handle());
        return result;
      }),
    );
  }
}
