import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from '../../src/login/login.service';
import { UsersService } from '../../src/user/users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import authConfig from '../../src/config/auth.config';
import dbConfig from '../../src/config/db.config';
import { UserWarehouseRoleService } from '../../src/userWarehouseRole/userWarehouseRole.service';
import { AuthService } from '../../src/auth/auth.service';

describe('LoginService', () => {
  let loginService: LoginService;
  const mockUserService = {
    findByUsername: jest.fn().mockResolvedValue({
      email: 'example@example.org',
      username: 'username',
      password: 'password1',
    }),
    getCookieInfo: jest.fn().mockReturnValue({
      user_id: 'user-1',
      username: 'username',
      org_id: 'org-1',
      org_role: 'member',
      warehouse_id: 'warehouse-1',
      warehouse_name: 'warehouse',
      warehouse_role: 'staff',
    }),
  };
  const mockUserWarehouseRoleService = {
    getUserWarehouses: jest.fn(),
  };
  const mockAuthService = {
    verifyPassword: jest.fn().mockResolvedValue(true),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: ConfigService,
          useValue: {
            // Mock the .get() method to return 1 salt round for fast tests
            get: jest.fn((key: string) => {
              if (key === 'auth.saltRounds') return 1;
              return null;
            }),
          },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: UserWarehouseRoleService,
          useValue: mockUserWarehouseRoleService,
        },
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env`, `.env.${process.env.NODE_ENV || 'test'}`],
          load: [authConfig, dbConfig],
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

    loginService = module.get<LoginService>(LoginService);
  });

  it('should be defined', () => {
    expect(loginService).toBeDefined();
  });

  describe('login', () => {
    it('should throw an error if provided with a wrong username', async () => {
      mockUserService.findByUsername.mockResolvedValueOnce(null);
      await expect(
        loginService.login({
          username: 'test',
          password: 'password1',
        }),
      ).rejects.toThrow('Wrong username or password');
    });
    it('should throw an error if provided with a wrong auth', async () => {
      mockAuthService.verifyPassword.mockResolvedValueOnce(false);
      await expect(
        loginService.login({
          username: 'test',
          password: 'password2',
        }),
      ).rejects.toThrow('Wrong username or password');
    });
    it('should call authService verifyPassword', async () => {
      await loginService.login({
        username: 'test',
        password: 'password2',
      });
      expect(mockAuthService.verifyPassword).toHaveBeenCalled();
    });
    it('should call usersService getCookieInfo with username', async () => {
      await loginService.login({
        username: 'test',
        password: 'password2',
      });
      expect(mockUserService.getCookieInfo).toHaveBeenCalledWith('username');
    });
    it('should return cookieInfo', async () => {
      const response = await loginService.login({
        username: 'test',
        password: 'password2',
      });
      expect(response).toMatchObject({
        user_id: 'user-1',
        username: 'username',
        org_id: 'org-1',
        org_role: 'member',
        warehouse_id: 'warehouse-1',
        warehouse_name: 'warehouse',
        warehouse_role: 'staff',
      });
    });
  });
});
