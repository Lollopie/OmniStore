import { UsersService } from '../../src/user/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { AuthService } from '../../src/auth/auth.service';
import { UserEntity } from '../../src/user/user.entity';
describe('UsersService', () => {
  let usersService: UsersService;
  const mockTxRepoProvider = {
    getRepo: jest.fn().mockImplementation((entity) => {
      if (entity === UserEntity) {
        return mockUsersRepository;
      }
      throw new Error(`Unexpected Entity ${entity}`);
    }),
  };
  const mockAuthService = {
    verifyPassword: jest.fn().mockResolvedValue(true),
    hashPassword: jest.fn().mockResolvedValue('mocked-hashed-password'),
  };
  const mockUsersRepository = {
    findOneBy: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'example@example.org',
      username: 'username',
      password: 'mocked-hashed-password',
    }),
    delete: jest.fn().mockResolvedValue('Delete successful'),
    query: jest.fn().mockResolvedValue({
      user_id: 'user-1',
      username: 'username',
      org_id: 'org-1',
      org_role: 'admin',
      warehouse_id: 'warehouse-1',
      warehouse_name: 'warehouse',
      warehouse_role: 'manager',
    }),
    save: jest.fn().mockResolvedValue({
      userId: 'user-1',
      email: 'example@example.org',
      username: 'username',
      password: 'mocked-new-hashed-password',
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: TxRepoProvider, useValue: mockTxRepoProvider },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });
  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });
  describe('findByUsername', () => {
    it('should call findOneBy with username', async () => {
      await usersService.findByUsername('username');
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        username: 'username',
      });
    });
    it('should return found user', async () => {
      const result = await usersService.findByUsername('username');
      expect(result).toEqual({
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-hashed-password',
      });
    });
  });
  describe('deleteUser', () => {
    it('should look up that user exists', async () => {
      await usersService.deleteUser('user-1', 'password1');
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });
    it("should throw if user doesn't exist", async () => {
      mockUsersRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(
        usersService.deleteUser('user-1', 'password1'),
      ).rejects.toThrow('User not found');
    });
    it('should call authService verifyPassword', async () => {
      await usersService.deleteUser('user-1', 'password1');
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith(
        'password1',
        'mocked-hashed-password',
      );
    });
    it('should throw if password is incorrect', async () => {
      mockAuthService.verifyPassword.mockResolvedValueOnce(false);
      await expect(
        usersService.deleteUser('user-1', 'password1'),
      ).rejects.toThrow('Invalid password');
    });
    it('should call userRepository delete', async () => {
      await usersService.deleteUser('user-1', 'password1');
      expect(mockUsersRepository.delete).toHaveBeenCalledWith('user-1');
    });
    it('should return userRepository delete return value', async () => {
      const result = await usersService.deleteUser('user-1', 'password1');
      expect(result).toEqual('Delete successful');
    });
  });
  describe('getCookieInfo', () => {
    it('should call get_cookie_info', async () => {
      await usersService.getCookieInfo('user-1');
      expect(mockUsersRepository.query).toHaveBeenCalledWith(
        'SELECT * FROM get_cookie_info($1)',
        ['user-1'],
      );
    });
    it('should throw if no cookie info was found', async () => {
      mockUsersRepository.query.mockResolvedValueOnce(null);
      await expect(usersService.getCookieInfo('user-1')).rejects.toThrow(
        'User not found',
      );
    });
    it('should return cookieInfo', async () => {
      const result = await usersService.getCookieInfo('user-1');
      expect(result).toEqual({
        user_id: 'user-1',
        username: 'username',
        org_id: 'org-1',
        org_role: 'admin',
        warehouse_id: 'warehouse-1',
        warehouse_name: 'warehouse',
        warehouse_role: 'manager',
      });
    });
  });
  describe('updatePassword', () => {
    it('shouould throw if new passwords do not match', async () => {
      await expect(
        usersService.updatePassword('user-1', {
          password: 'password1',
          newPassword: 'newPassword1',
          confirmPassword: 'newPassword2',
        }),
      ).rejects.toThrow('New passwords do not match');
    });
    it('should check if user exists', async () => {
      await usersService.updatePassword('user-1', {
        password: 'password1',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1',
      });
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });
    it('should throw if user does not exist', async () => {
      await usersService.updatePassword('user-1', {
        password: 'password1',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1',
      });
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });
    it('should verify the current password', async () => {
      await usersService.updatePassword('user-1', {
        password: 'password1',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1',
      });
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith(
        'password1',
        'mocked-hashed-password',
      );
    });
    it('should throw if the current password is incorrect', async () => {
      mockAuthService.verifyPassword.mockResolvedValueOnce(false);
      await expect(
        usersService.updatePassword('user-1', {
          password: 'password1',
          newPassword: 'newPassword1',
          confirmPassword: 'newPassword1',
        }),
      ).rejects.toThrow('Invalid password');
    });
    it('should hash the new password', async () => {
      await usersService.updatePassword('user-1', {
        password: 'password1',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1',
      });
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('newPassword1');
    });
    it('should save the user with new Password', async () => {
      mockAuthService.hashPassword.mockResolvedValueOnce(
        'mocked-new-hashed-password',
      );
      await usersService.updatePassword('user-1', {
        password: 'password1',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1',
      });
      expect(mockUsersRepository.save).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-new-hashed-password',
      });
    });
    it('should return the updated user', async () => {
      const result = await usersService.updatePassword('user-1', {
        password: 'password1',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1',
      });
      expect(result).toEqual({
        userId: 'user-1',
        email: 'example@example.org',
        username: 'username',
        password: 'mocked-new-hashed-password',
      });
    });
  });
});
