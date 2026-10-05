import { ConfigService } from '@nestjs/config';
import { RevocationService } from '../../src/auth/revocation.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
};
jest.mock('ioredis', () => jest.fn().mockImplementation(() => mockRedis));

describe('RevocationService', () => {
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'auth.jwtExpiresIn') {
        return 900;
      }
      if (key === 'db.redisUrl') {
        return 'redis://localhost:6379';
      }
      return null;
    }),
  } as unknown as ConfigService;
  let service: RevocationService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new RevocationService(mockConfigService);
  });
  describe('revokeUser', () => {
    it('should store the revocation time for as long as an access token lives', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(5_000_000));
      await service.revokeUser('user-1');
      jest.useRealTimers();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'auth:revoked:user-1',
        '5000',
        'EX',
        900,
      );
    });
    it('should not throw when Redis is unavailable', async () => {
      mockRedis.set.mockRejectedValueOnce(new Error('Connection is closed.'));
      await expect(service.revokeUser('user-1')).resolves.toBeUndefined();
    });
  });
  describe('check', () => {
    it('should accept users without a revocation', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      await expect(service.check('user-1', 1000)).resolves.toBe('ok');
      expect(mockRedis.get).toHaveBeenCalledWith('auth:revoked:user-1');
    });
    it('should reject tokens issued before the revocation', async () => {
      mockRedis.get.mockResolvedValueOnce('2000');
      await expect(service.check('user-1', 1000)).resolves.toBe('revoked');
    });
    it('should reject tokens issued in the same second as the revocation', async () => {
      mockRedis.get.mockResolvedValueOnce('2000');
      await expect(service.check('user-1', 2000)).resolves.toBe('revoked');
    });
    it('should accept tokens issued after the revocation', async () => {
      mockRedis.get.mockResolvedValueOnce('2000');
      await expect(service.check('user-1', 2001)).resolves.toBe('ok');
    });
    it('should reject tokens without issue time when the user is revoked', async () => {
      mockRedis.get.mockResolvedValueOnce('2000');
      await expect(service.check('user-1', undefined)).resolves.toBe('revoked');
    });
    it('should report unknown when Redis is unavailable', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Connection is closed.'));
      await expect(service.check('user-1', 1000)).resolves.toBe('unknown');
    });
  });
});
