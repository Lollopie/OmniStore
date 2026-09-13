import { AuthGuard } from '../../src/auth/auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { AuthenticatedRequest, Cookie } from '../../src/user/user.decorator';
import { Request } from 'express';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
describe('AuthGuard', () => {
  const mockClsService = {
    set: jest.fn(),
  };
  let service: AuthGuard;
  function makeMockRequest<T extends Request = Request>(
    cookies?: Record<string, unknown>,
  ): T {
    return {
      cookies,
    } as unknown as T;
  }
  const validCookie: Cookie = {
    username: 'testuser',
    userId: 'user-1',
    orgId: 'org-1',
    activeWarehouseId: 'warehouse-1',
    activeRole: 'staff',
  };
  let token: string;
  let mockRequest: AuthenticatedRequest;
  const mockJwtService = {
    verifyAsync: jest.fn().mockResolvedValue(validCookie),
    signAsync: jest.fn().mockResolvedValue('valid-token'),
  };
  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    token = await mockJwtService.signAsync(validCookie);
    mockRequest = makeMockRequest<AuthenticatedRequest>({
      token: token,
    });
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();
    service = module.get<AuthGuard>(AuthGuard);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('validateToken', () => {
    it('should throw UnauthorizedException if no cookies are provided', async () => {
      const mockRequest = {} as unknown as Request;
      await expect(service.validateToken(mockRequest)).rejects.toThrow(
        new UnauthorizedException('No token provided'),
      );
    });
    it('should throw UnauthorizedException if no token is provided', async () => {
      const mockRequest = makeMockRequest({});
      await expect(service.validateToken(mockRequest)).rejects.toThrow(
        new UnauthorizedException('No token provided'),
      );
    });
    it("should throw UnauthorizedException if token isn't a string", async () => {
      const mockRequest = makeMockRequest({ token: 12345 });
      await expect(service.validateToken(mockRequest)).rejects.toThrow(
        new UnauthorizedException('No token provided'),
      );
    });
    it('should throw UnauthorizedException if cookie is empty string', async () => {
      const mockRequest = makeMockRequest({ token: '' });
      await expect(service.validateToken(mockRequest)).rejects.toThrow(
        new UnauthorizedException('No token provided'),
      );
    });
    it('should throw UnauthorizedException if false token is provided', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('Invalid token'),
      );
      const mockRequest = makeMockRequest({ token: 'invalid-token' });
      await expect(service.validateToken(mockRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
    });
    it('should set user data in the request', async () => {
      const cookie: Cookie = {
        username: 'testuser',
        userId: 'user-1',
        orgId: 'org-1',
        activeWarehouseId: 'warehouse-1',
        activeRole: 'staff',
      };
      const token = await service['jwtService'].signAsync(cookie);
      const mockRequest = makeMockRequest<AuthenticatedRequest>({
        token: token,
      });
      await service.validateToken(mockRequest);
      expect(mockRequest.user).toMatchObject(cookie);
      expect(mockClsService.set).toHaveBeenCalledWith('orgId', cookie.orgId);
      expect(mockClsService.set).toHaveBeenCalledWith(
        'warehouseId',
        cookie.activeWarehouseId,
      );
      expect(mockClsService.set).toHaveBeenCalledWith('userId', cookie.userId);
    });
    it('should throw UnauthorizedException if an expired token is provided', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('jwt expired'),
      );
      const mockRequest = makeMockRequest({ token: token });
      jest.useFakeTimers();
      jest.setSystemTime(new Date(Date.now() + 3600 * 1000 + 5000)); // 1h + 5s buffer
      await expect(service.validateToken(mockRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
      jest.useRealTimers();
    });
  });
  describe('canActivate', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
    it('should return true if validateToken resolves', async () => {
      await expect(service.canActivate(mockExecutionContext)).resolves.toBe(
        true,
      );
    });
    it('should set user data in the request', async () => {
      await service.canActivate(mockExecutionContext);
      expect(mockRequest.user).toMatchObject(validCookie);
    });
  });
});
