import { RlsInterceptor } from '../../src/rls/rls.interceptor';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { firstValueFrom, Observable, of } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
describe('LogoutController', () => {
  let rlsInterceptor: RlsInterceptor;
  const mockEntityManager = {
    query: jest.fn().mockResolvedValue(undefined),
  };
  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation(
        (callback: (entityManager: any) => Observable<unknown>) =>
          callback(mockEntityManager),
      ),
  };
  const mockClsService = {
    get: jest.fn().mockImplementation((target) => {
      if (target === 'userId') {
        return 'user-1';
      }
      if (target === 'warehouseId') {
        return 'warehouse-1';
      }
      if (target === 'orgId') {
        return 'org-1';
      }
      throw new Error(`Unexpected key: ${target}`);
    }),
    set: jest.fn(),
  };
  const mockReturnValue = { success: true, data: 'test' };
  const mockNext: CallHandler = {
    handle: jest.fn().mockReturnValue(of(mockReturnValue)),
  };
  const mockContext = {} as ExecutionContext;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RlsInterceptor,
        { provide: ClsService, useValue: mockClsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    rlsInterceptor = module.get<RlsInterceptor>(RlsInterceptor);
  });
  it('should be defined', () => {
    expect(rlsInterceptor).toBeDefined();
  });
  describe('logout', () => {
    it('should read userId from clsService', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockClsService.get).toHaveBeenCalledWith('userId');
    });
    it('should read orgId from clsService', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockClsService.get).toHaveBeenCalledWith('orgId');
    });
    it('should read warehouseId from clsService', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockClsService.get).toHaveBeenCalledWith('warehouseId');
    });
    it('should not call manager query if userId is not set', async () => {
      const mockFunction = (target: string) => {
        if (target === 'userId') {
          return null;
        }
        if (target === 'warehouseId') {
          return 'warehouse-1';
        }
        if (target === 'orgId') {
          return 'org-1';
        }
        throw new Error(`Unexpected key: ${target}`);
      };
      mockClsService.get
        .mockImplementationOnce(mockFunction)
        .mockImplementationOnce(mockFunction)
        .mockImplementationOnce(mockFunction);
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockEntityManager.query).not.toHaveBeenCalledWith(
        `SELECT set_config('app.current_user_id', $1, true)`,
        ['user-1'],
      );
    });
    it('should not call manager query if warehouseId is not set', async () => {
      const mockFunction = (target: string) => {
        if (target === 'userId') {
          return 'user-1';
        }
        if (target === 'warehouseId') {
          return null;
        }
        if (target === 'orgId') {
          return 'org-1';
        }
        throw new Error(`Unexpected key: ${target}`);
      };
      mockClsService.get
        .mockImplementationOnce(mockFunction)
        .mockImplementationOnce(mockFunction)
        .mockImplementationOnce(mockFunction);
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockEntityManager.query).not.toHaveBeenCalledWith(
        `SELECT set_config('app.current_warehouse_id', $1, true)`,
        ['warehouse-1'],
      );
    });
    it('should not call manager query if orgId is not set', async () => {
      const mockFunction = (target: string) => {
        if (target === 'userId') {
          return 'user-1';
        }
        if (target === 'warehouseId') {
          return 'warehouse-1';
        }
        if (target === 'orgId') {
          return null;
        }
        throw new Error(`Unexpected key: ${target}`);
      };
      mockClsService.get
        .mockImplementationOnce(mockFunction)
        .mockImplementationOnce(mockFunction)
        .mockImplementationOnce(mockFunction);
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockEntityManager.query).not.toHaveBeenCalledWith(
        `SELECT set_config('app.current_org_id', $1, true)`,
        ['org-1'],
      );
    });
    it('should call manager query if userId is set', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockEntityManager.query).toHaveBeenCalledWith(
        `SELECT set_config('app.current_user_id', $1, true)`,
        ['user-1'],
      );
    });
    it('should call manager query if warehouseId is set', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockEntityManager.query).toHaveBeenCalledWith(
        `SELECT set_config('app.current_warehouse_id', $1, true)`,
        ['warehouse-1'],
      );
    });
    it('should call manager query if orgId is set', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockEntityManager.query).toHaveBeenCalledWith(
        `SELECT set_config('app.current_org_id', $1, true)`,
        ['org-1'],
      );
    });
    it('should set entityManager inside clsService', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      expect(mockClsService.set).toHaveBeenCalledWith(
        'entityManager',
        mockEntityManager,
      );
    });
    it('should pass to the next function', async () => {
      await firstValueFrom(rlsInterceptor.intercept(mockContext, mockNext));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockNext.handle).toHaveBeenCalled();
    });
    it('should return result', async () => {
      const result = await firstValueFrom(
        rlsInterceptor.intercept(mockContext, mockNext),
      );
      expect(result).toEqual({ success: true, data: 'test' });
    });
  });
});
