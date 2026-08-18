import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { UsersService } from '../user/users.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
describe('LoginService (Unit Test)', () => {
  let registerService: RegisterService;
  let usersServiceMock: jest.Mocked<UsersService>;
  let authService: AuthService;
  beforeEach(async () => {
    const mockUserService = {
      createUser: jest.fn(),
      findByUsername: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        AuthService,
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
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    registerService = module.get<RegisterService>(RegisterService);
    authService = module.get<AuthService>(AuthService);
    usersServiceMock = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(registerService).toBeDefined();
  });

  describe('register', () => {
    it('should throw an error if provided with an existing username', async () => {
      usersServiceMock.findByUsername.mockResolvedValue({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.org',
        username: 'test',
        password: await authService.hashPassword('password1'),
      });
      const invalidData = {
        username: 'test',
        password: 'password1',
      };
      await expect(registerService.register(invalidData)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersServiceMock.createUser.mock.calls.length).toBe(0);
    });
    it('should successfully save a user if data is valid', async () => {
      // Program the mock to simulate a successful DB insertion
      usersServiceMock.findByUsername.mockResolvedValue(null); // No user found, email is free
      usersServiceMock.createUser.mockResolvedValue({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.org',
        username: 'test',
        password: await authService.hashPassword('password1'),
      });

      const validData = { username: 'test', password: 'password1' };
      const result = await registerService.register(validData);

      // Assertions
      expect(result).toBeDefined();
      expect(usersServiceMock.createUser.mock.calls.length).toBe(1);
    });
  });
});
