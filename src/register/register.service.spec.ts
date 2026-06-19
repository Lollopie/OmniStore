import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { UsersService } from '../user/users.service';
import { BadRequestException } from '@nestjs/common';

describe('RegisterService (Unit Test)', () => {
  let registerService: RegisterService;
  let usersServiceMock: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUserService = {
      createUser: jest.fn(),
      findByUsername: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    registerService = module.get<RegisterService>(RegisterService);
    usersServiceMock = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(registerService).toBeDefined();
  });

  describe('register', () => {
    it('should throw an error if provided with an existing username', async () => {
      usersServiceMock.findByUsername.mockResolvedValue({
        id: 1,
        username: 'test',
        password: 'password1',
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
        id: 2,
        username: 'test',
        password: 'password1',
      });

      const validData = { username: 'test', password: 'password1' };
      const result = await registerService.register(validData);

      // Assertions
      expect(result).toBeDefined();
      expect(usersServiceMock.createUser.mock.calls.length).toBe(1);
    });
  });
});
