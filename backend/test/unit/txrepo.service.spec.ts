import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { InviteEntity } from '../../src/invite/invite.entity';
describe('TxRepo', () => {
  let txRepoProvider: TxRepoProvider;
  const mockEntityManager = {
    getRepository: jest.fn().mockReturnValue('mockRepository'),
  };
  const mockClsService = {
    get: jest.fn().mockReturnValue(mockEntityManager),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TxRepoProvider,
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    txRepoProvider = module.get<TxRepoProvider>(TxRepoProvider);
  });
  it('should be defined', () => {
    expect(txRepoProvider).toBeDefined();
  });
  describe('getRepo', () => {
    it('should get entityManager from clsService', () => {
      txRepoProvider.getRepo(InviteEntity);
      expect(mockClsService.get).toHaveBeenCalledWith('entityManager');
    });
    it("should throw an error if entityManager isn't defined", () => {
      mockClsService.get.mockReturnValueOnce(null);
      expect(() => txRepoProvider.getRepo(InviteEntity)).toThrow(
        'No transactional EntityManager in CLS — RlsInterceptor did not run',
      );
    });
    it('should return repository from entityManager', () => {
      const result = txRepoProvider.getRepo(InviteEntity);
      expect(result).toEqual('mockRepository');
    });
  });
  describe('getManager', () => {
    it('should get entityManager from clsService', () => {
      txRepoProvider.getManager();
      expect(mockClsService.get).toHaveBeenCalledWith('entityManager');
    });
    it("should throw an error if entityManager isn't defined", () => {
      mockClsService.get.mockReturnValueOnce(null);
      expect(() => txRepoProvider.getManager()).toThrow(
        'No transactional EntityManager in CLS — RlsInterceptor did not run',
      );
    });
    it('should return entityManager from clsService', () => {
      const result = txRepoProvider.getManager();
      expect(result).toEqual(mockEntityManager);
    });
  });
});
