import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { UsersService } from '../user/users.service';
import { BadRequestException } from '@nestjs/common';
import { User } from '../user/user.entity';

describe('RegisterService (Unit Test)', () => {
  let registerService: RegisterService;
  let usersServiceMock: jest.Mocked<UsersService>;

  beforeEach(async () => {
    // 1. Create a mock object with the methods of UserService
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
    // Cast it as a jest.Mocked type so TypeScript knows we can use jest methods on it
    usersServiceMock = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(registerService).toBeDefined();
  });

  describe('register', () => {
    it('should throw an error if provided with an invalid/existing username', async () => {
      // 3. Program the mock to simulate a scenario (e.g., user already exists)
      usersServiceMock.findByUsername.mockResolvedValue({
        id: 1,
        username: 'test',
        password: 'test',
      });

      const invalidData: User = {
        id: 1,
        username: 'test',
        password: '',
      };

      // 4. Assert that the service correctly throws an error
      await expect(registerService.register(invalidData)).rejects.toThrow(
        BadRequestException, // Or whatever specific error your code throws
      );

      // 5. Verify the DB wasn't touched (create shouldn't be called if email is taken)
      expect(usersServiceMock.createUser.mock.calls.length).toBe(0);
    });

    it('should successfully save a user if data is valid', async () => {
      // Program the mock to simulate a successful DB insertion
      usersServiceMock.findByUsername.mockResolvedValue(null); // No user found, email is free
      usersServiceMock.createUser.mockResolvedValue({
        id: 2,
        username: 'test',
        password: 'test',
      });

      const validData = { id: 2, username: 'test', password: 'test' };
      const result = await registerService.register(validData);

      // Assertions
      expect(result).toBeDefined();
      expect(usersServiceMock.createUser.mock.calls.length).toBe(1);
    });
  });
});
