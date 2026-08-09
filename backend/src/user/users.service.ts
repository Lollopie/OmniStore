import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { RegisterDto } from '@shared/dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { ChangePasswordDto } from '@shared/dto/changePassword.dto';
import { TxRepoProvider } from '../rls/db.helper';

@Injectable()
export class UsersService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly passwordService: PasswordService,
  ) {}
  findByUsername(userName: string): Promise<UserEntity | null> {
    const repo = this.txRepoProvider.getRepo(UserEntity);
    return repo.findOneBy({ username: userName });
  }
  async createUser(user: RegisterDto) {
    const repo = this.txRepoProvider.getRepo(UserEntity);
    const newUser = repo.create(user);
    return await repo.save(newUser);
  }
  async deleteUser(userId: string, password: string) {
    const repo = this.txRepoProvider.getRepo(UserEntity);
    const user = await repo.findOneBy({ userId: userId });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordCorrect = await this.passwordService.verifyPassword(
      password,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid password');
    }

    return await repo.delete(userId);
  }
  async updatePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new UnauthorizedException('New passwords do not match');
    }
    const repo = this.txRepoProvider.getRepo(UserEntity);
    const user = await repo.findOneBy({
      userId: userId,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (
      !(await this.passwordService.verifyPassword(
        changePasswordDto.password,
        user.password,
      ))
    ) {
      throw new UnauthorizedException('Invalid password');
    }
    user.password = await this.passwordService.hashPassword(
      changePasswordDto.confirmPassword,
    );
    return await repo.save(user);
  }
}
