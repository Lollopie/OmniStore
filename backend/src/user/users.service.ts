import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { RegisterDto } from '@shared/dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';
import { ChangePasswordDto } from '@shared/dto/changePassword.dto';
import { TxRepoProvider } from '../rls/db.helper';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly txRepoProvider: TxRepoProvider,
    private readonly authService: AuthService,
  ) {}
  findByUsername(userName: string): Promise<UserEntity | null> {
    const repo = this.txRepoProvider.getRepo(UserEntity);
    return repo.findOneBy({ username: userName });
  }
  async createUser(user: RegisterDto): Promise<UserEntity> {
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

    const isPasswordCorrect = await this.authService.verifyPassword(
      password,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid password');
    }

    return await repo.delete(userId);
  }
  async getCookieInfo(username: string) {
    const repo = this.txRepoProvider.getRepo(UserEntity);
    const cookieInfo: {
      user_id: string;
      username: string;
      org_id: string;
      org_role: string;
      warehouse_id: string;
      warehouse_name: string;
      warehouse_role: string;
    }[] = await repo.query('SELECT * FROM get_cookie_info($1)', [username]);
    if (!cookieInfo) {
      throw new UnauthorizedException('User not found');
    }
    return cookieInfo;
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
      !(await this.authService.verifyPassword(
        changePasswordDto.password,
        user.password,
      ))
    ) {
      throw new UnauthorizedException('Invalid password');
    }
    user.password = await this.authService.hashPassword(
      changePasswordDto.confirmPassword,
    );
    return await repo.save(user);
  }
}
