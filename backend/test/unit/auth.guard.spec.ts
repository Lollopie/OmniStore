import { AuthGuard } from '../../src/auth/auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from '../../src/config/auth.config';
import { JwtModule } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { Cookie } from '../../src/user/user.decorator';

describe('AuthGuard', () => {
  const mockClsService = {
    set: jest.fn(),
  };
  let service: AuthGuard;
  let clsService: jest.Mocked<ClsService>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        AuthGuard,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV || 'test'}`, `.env`],
          load: [authConfig],
        }),
        JwtModule.registerAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwtSecret'),
            signOptions: { expiresIn: '1h' },
          }),
        }),
      ],
    }).compile();
    service = module.get<AuthGuard>(AuthGuard);
    clsService = module.get(ClsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should throw UnauthorizedException if no cookies are provided', async () => {
    const mockRequest: any = {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.validateToken(mockRequest)).rejects.toThrow(
      'No token provided',
    );
  });
  it('should throw UnauthorizedException if no token is provided', async () => {
    const mockRequest: any = {
      cookies: {},
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.validateToken(mockRequest)).rejects.toThrow(
      'No token provided',
    );
  });
  it("should throw UnauthorizedException if token isn't a string", async () => {
    const mockRequest: any = {
      cookies: { token: 123 },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.validateToken(mockRequest)).rejects.toThrow(
      'No token provided',
    );
  });
  it('should throw UnauthorizedException if false token is provided', async () => {
    const mockRequest: any = {
      cookies: { token: 'invalid-token' },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.validateToken(mockRequest)).rejects.toThrow(
      'Invalid token',
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
    const mockRequest: any = {
      cookies: { token: token },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.validateToken(mockRequest)).resolves.not.toThrow(
      'No token provided',
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockRequest.user).toMatchObject(cookie);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(clsService.set).toHaveBeenCalledWith('orgId', cookie.orgId);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(clsService.set).toHaveBeenCalledWith(
      'warehouseId',
      cookie.activeWarehouseId,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(clsService.set).toHaveBeenCalledWith('userId', cookie.userId);
  });
  it('should throw UnauthorizedException if an expired token is provided', async () => {
    const cookie: Cookie = {
      username: 'testuser',
      userId: 'user-1',
      orgId: 'org-1',
      activeWarehouseId: 'warehouse-1',
      activeRole: 'staff',
    };
    const token = await service['jwtService'].signAsync(cookie);
    const mockRequest: any = {
      cookies: { token: token },
    };
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.now() + 3600000)); // Fast-forward time by 1 hour
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.validateToken(mockRequest)).rejects.toThrow(
      'Invalid token',
    );
  });
});
