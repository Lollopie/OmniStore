import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';

@Injectable()
export class TxRepoProvider {
  constructor(private readonly cls: ClsService) {}

  getRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    const manager: EntityManager = this.cls.get('entityManager');
    if (!manager) {
      throw new Error(
        'No transactional EntityManager in CLS — RlsInterceptor did not run',
      );
    }
    return manager.getRepository(entity);
  }
  getManager(): EntityManager {
    const manager: EntityManager = this.cls.get('entityManager');
    if (!manager) {
      throw new Error(
        'No transactional EntityManager in CLS — RlsInterceptor did not run',
      );
    }
    return manager;
  }
}
