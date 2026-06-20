import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service';
import { UsersService } from '../user/users.service';
import { BadRequestException } from '@nestjs/common';
import { PasswordService } from '../password/password.service';
import { ConfigService } from '@nestjs/config';

describe('LoginService (Unit Test)', () => {
  let loginService: LoginService;
  let usersServiceMock: jest.Mocked<UsersService>;
  let passwordService: PasswordService;
  beforeEach(async () => {
    const mockUserService = {
      findByUsername: jest.fn(),
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
      ],
    }).compile();

    loginService = module.get<LoginService>(LoginService);
    passwordService = module.get<PasswordService>(PasswordService);
    usersServiceMock = module.get(UsersService);
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
        BadRequestException,
      );
      expect(usersServiceMock.findByUsername.mock.calls.length).toBe(1);
    });
    it('should throw an error if provided with a wrong password', async () => {
      usersServiceMock.findByUsername.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'test',
        password: await passwordService.hashPassword('password1'),
      });
      const invalidData = {
        username: 'test',
        password: 'password2',
      };
      await expect(loginService.login(invalidData)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersServiceMock.findByUsername.mock.calls.length).toBe(1);
    });
    it('should successfully login user if data is valid', async () => {
      // Program the mock to simulate a successful DB insertion
      usersServiceMock.findByUsername.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'test',
        password: await passwordService.hashPassword('password1'),
      });
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
