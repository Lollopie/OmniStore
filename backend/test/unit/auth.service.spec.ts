import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/auth/auth.service';

describe('AuthService', () => {
  const mockJwtService = {
    sign: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'auth.jwtExpiresIn') {
        return 3600; // 1 hour in seconds
      }
      if (key === 'auth.saltRounds') {
        return 10; // Example salt rounds for bcrypt
      }
      return null;
    }),
  };
  let service: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('createAndSendCookie', () => {
    it('should create a JWT token and send it as a cookie in the response', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockResponse = {
        cookie: jest.fn(),
      } as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mockCookie = {} as any;
      mockJwtService.sign.mockReturnValue('mocked-jwt-token');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.createAndSendCookie(mockCookie, mockResponse);
      expect(mockJwtService.sign).toHaveBeenLastCalledWith(mockCookie);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockResponse.cookie).toHaveBeenLastCalledWith(
        'token',
        'mocked-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          maxAge: expect.any(Number),
        }),
      );
    });
  });
  describe('hashPassword', () => {
    it('should hash the password using bcrypt', async () => {
      const password = 'myPassword';
      const hashedPassword = await service.hashPassword(password);
      expect(hashedPassword).not.toEqual(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash format
      expect(mockConfigService.get).toHaveBeenLastCalledWith('auth.saltRounds');
    });
  });
  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'myPassword';
      const hashedPassword = await service.hashPassword(password);
      const isMatch = await service.verifyPassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });
    it('should not verify incorrect password', async () => {
      const password = 'myPassword';
      const hashedPassword = await service.hashPassword(password);
      const isMatch = await service.verifyPassword(
        'wrongPassword',
        hashedPassword,
      );
      expect(isMatch).toBe(false);
    });
  });
  describe('hashToken', () => {
    it('should hash the token using SHA-256', () => {
      const token = 'myToken';
      const hashedToken = service.hashToken(token);
      expect(hashedToken).toHaveLength(64); // SHA-256 produces a 64-character hex string
      expect(hashedToken).toMatch(/^[a-f0-9]{64}$/); // Check if it's a valid hex string
    });
    it('should produce known hash for a known token', () => {
      const token = 'testToken';
      const expectedHash =
        '4b4a2dd847324503f0febd6955148a7737ca1c9a1ceef7690e0c2b827577ec5f';
      const hashedToken = service.hashToken(token);
      expect(hashedToken).toEqual(expectedHash);
    });
  });
  describe('generateRandomToken', () => {
    it('should generate a random token', () => {
      const token = service.generateRandomToken();
      expect(token).toHaveLength(64); // 32 bytes in hex is 64 characters
      expect(token).toMatch(/^[a-f0-9]{64}$/); // Check if it's a valid hex string
    });
  });
});
