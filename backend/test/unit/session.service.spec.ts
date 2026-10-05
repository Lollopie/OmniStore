import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { SessionService } from '../../src/auth/session.service';
import { GuardDBService } from '../../src/utils/guardDB.service';
import { RevocationService } from '../../src/auth/revocation.service';
import { Cookie } from '../../src/user/user.decorator';
import { ClsService } from 'nestjs-cls';

const sha256 = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

describe('SessionService', () => {
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'auth.refreshExpiresIn') {
        return 604800;
      }
      return null;
    }),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('access-token'),
    verifyAsync: jest.fn(),
  };
  const mockGuardDBService = {
    createRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    revokeUserRefreshTokens: jest.fn(),
    getUserSession: jest.fn(),
    getUserWarehouseRole: jest.fn(),
  };
  const mockRevocationService = {
    revokeUser: jest.fn(),
  };
  const mockEntityManager = { query: jest.fn() };
  const mockClsService = {
    get: jest.fn((key: string) =>
      key === 'entityManager' ? mockEntityManager : undefined,
    ),
  };
  const cookie: Cookie = {
    userId: 'user-1',
    username: 'username',
    orgId: 'org-1',
    activeWarehouseId: 'warehouse-1',
    activeRole: 'staff',
  };
  let service: SessionService;
  let res: Response & { cookie: jest.Mock; clearCookie: jest.Mock };
  const makeRequest = (cookies: Record<string, unknown>) =>
    ({ cookies }) as unknown as Request;
  const cookieValue = (name: string): string =>
    res.cookie.mock.calls.find(([cookieName]) => cookieName === name)?.[1];

  beforeEach(async () => {
    jest.clearAllMocks();
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response & { cookie: jest.Mock; clearCookie: jest.Mock };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: GuardDBService, useValue: mockGuardDBService },
        { provide: RevocationService, useValue: mockRevocationService },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();
    service = module.get(SessionService);
  });

  describe('sendAccessToken', () => {
    it('should sign only the session claims', () => {
      service.sendAccessToken({ ...cookie, exp: 1, iat: 1 }, res);
      expect(mockJwtService.sign).toHaveBeenCalledWith(cookie);
    });
    it('should keep the cookie as long as the refresh token', () => {
      service.sendAccessToken(cookie, res);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'access-token',
        expect.objectContaining({ httpOnly: true, maxAge: 604800 * 1000 }),
      );
    });
  });

  describe('issueSession', () => {
    it('should store the hash of the refresh token it sends', async () => {
      await service.issueSession(cookie, res);
      const refreshToken = cookieValue('refresh_token');
      expect(refreshToken).toMatch(/^[0-9a-f]{64}$/);
      expect(mockGuardDBService.createRefreshToken).toHaveBeenCalledWith(
        'user-1',
        sha256(refreshToken),
        expect.any(Date),
        mockEntityManager,
      );
      expect(cookieValue('token')).toBe('access-token');
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      mockGuardDBService.rotateRefreshToken.mockResolvedValue({
        userId: 'user-1',
        reused: false,
      });
      mockGuardDBService.getUserSession.mockResolvedValue({
        username: 'username',
        orgId: 'org-1',
        orgRole: 'member',
      });
      mockJwtService.verifyAsync.mockResolvedValue(cookie);
      mockGuardDBService.getUserWarehouseRole.mockResolvedValue('manager');
    });
    it('should reject requests without a refresh token', async () => {
      await expect(service.refresh(makeRequest({}), res)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockGuardDBService.rotateRefreshToken).not.toHaveBeenCalled();
    });
    it('should rotate the presented refresh token', async () => {
      await service.refresh(makeRequest({ refresh_token: 'old' }), res);
      const newToken = cookieValue('refresh_token');
      expect(mockGuardDBService.rotateRefreshToken).toHaveBeenCalledWith(
        sha256('old'),
        sha256(newToken),
        expect.any(Date),
      );
    });
    it('should rebuild the claims and keep a warehouse the user still belongs to', async () => {
      await service.refresh(
        makeRequest({ refresh_token: 'old', token: 'expired' }),
        res,
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('expired', {
        ignoreExpiration: true,
      });
      expect(mockGuardDBService.getUserWarehouseRole).toHaveBeenCalledWith(
        'user-1',
        'warehouse-1',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        ...cookie,
        activeRole: 'manager',
      });
    });
    it('should drop a warehouse the user no longer belongs to', async () => {
      mockGuardDBService.getUserWarehouseRole.mockResolvedValueOnce(null);
      await service.refresh(
        makeRequest({ refresh_token: 'old', token: 'expired' }),
        res,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        ...cookie,
        activeWarehouseId: '',
        activeRole: '',
      });
    });
    it('should ignore an access token of another user', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        ...cookie,
        userId: 'user-2',
      });
      await service.refresh(
        makeRequest({ refresh_token: 'old', token: 'other' }),
        res,
      );
      expect(mockGuardDBService.getUserWarehouseRole).not.toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ activeWarehouseId: '' }),
      );
    });
    it('should reject unknown or expired refresh tokens and clear the cookies', async () => {
      mockGuardDBService.rotateRefreshToken.mockResolvedValueOnce(null);
      await expect(
        service.refresh(makeRequest({ refresh_token: 'old' }), res),
      ).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.anything());
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.anything(),
      );
      expect(res.cookie).not.toHaveBeenCalled();
    });
    it('should end every session of the user when a rotated token is reused', async () => {
      mockGuardDBService.rotateRefreshToken.mockResolvedValueOnce({
        userId: 'user-1',
        reused: true,
      });
      await expect(
        service.refresh(makeRequest({ refresh_token: 'old' }), res),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockGuardDBService.revokeUserRefreshTokens).toHaveBeenCalledWith(
        'user-1',
      );
      expect(mockRevocationService.revokeUser).toHaveBeenCalledWith('user-1');
      expect(res.cookie).not.toHaveBeenCalled();
    });
    it('should reject users that no longer have an organization', async () => {
      mockGuardDBService.getUserSession.mockResolvedValueOnce(null);
      await expect(
        service.refresh(makeRequest({ refresh_token: 'old' }), res),
      ).rejects.toThrow(UnauthorizedException);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('endSession', () => {
    it('should delete the refresh token and clear both cookies', async () => {
      await service.endSession(makeRequest({ refresh_token: 'old' }), res);
      expect(mockGuardDBService.deleteRefreshToken).toHaveBeenCalledWith(
        sha256('old'),
      );
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.anything());
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.anything(),
      );
    });
    it('should still clear the cookies without a refresh token', async () => {
      await service.endSession(makeRequest({}), res);
      expect(mockGuardDBService.deleteRefreshToken).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
