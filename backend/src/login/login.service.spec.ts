import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service';
import { UsersService } from '../user/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import authConfig from '../config/auth.config';
import dbConfig from '../config/db.config';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';

describe('LoginService (Unit Test)', () => {
  let loginService: LoginService;
  let usersServiceMock: jest.Mocked<UsersService>;
  let passwordService: PasswordService;
  let userWarehouseRoleServiceMock: jest.Mocked<UserWarehouseRoleService>;
  beforeEach(async () => {
    const mockUserService = {
      findByUsername: jest.fn(),
    };
    const mockUserWarehouseRoleService = {
      findByUserId: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
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
        LoginService,
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
            secret: configService.get<string>('auth.jwtSecret'), // 3. Dynamically fetch the secret
            signOptions: { expiresIn: '1h' },
          }),
        }),
      ],
    }).compile();

    loginService = module.get<LoginService>(LoginService);
    passwordService = module.get<PasswordService>(PasswordService);
    usersServiceMock = module.get(UsersService);
    userWarehouseRoleServiceMock = module.get(UserWarehouseRoleService);
  });

  it('should be defined', () => {
    expect(loginService).toBeDefined();
  });

  describe('login', () => {
    it('should throw an error if provided with a wrong username', async () => {
      usersServiceMock.findByUsername.mockResolvedValue(null);
      const invalidData = {
        username: 'test',
        password: 'password1',
      };
      await expect(loginService.login(invalidData)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersServiceMock.findByUsername.mock.calls.length).toBe(1);
    });
    it('should throw an error if provided with a wrong auth', async () => {
      usersServiceMock.findByUsername.mockResolvedValue({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'test',
        password: await passwordService.hashPassword('password1'),
      });
      userWarehouseRoleServiceMock.findByUserId.mockResolvedValue(null);
      const invalidData = {
        username: 'test',
        password: 'password2',
      };
      await expect(loginService.login(invalidData)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersServiceMock.findByUsername.mock.calls.length).toBe(1);
    });
    it('should successfully login user if data is valid', async () => {
      // Program the mock to simulate a successful DB insertion
      usersServiceMock.findByUsername.mockResolvedValue({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'test',
        password: await passwordService.hashPassword('password1'),
      });
      userWarehouseRoleServiceMock.findByUserId.mockResolvedValue(null);
      const validData = {
        username: 'test',
        password: 'password1',
      };
      const result = await loginService.login(validData);

      // Assertions
      expect(result).toBeDefined();
      expect(usersServiceMock.findByUsername.mock.calls.length).toBe(1);
    });
  });
});
