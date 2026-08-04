import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { RegisterDto } from '@shared/dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';

@Injectable()
export class UsersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private passwordService: PasswordService,
  ) {}
  findByUsername(userName: string): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ username: userName });
  }
  async createUser(user: RegisterDto) {
    const newUser = this.usersRepository.create(user);
    return await this.usersRepository.save(newUser);
  }
  async deleteUser(userId: string, password: string) {
    const user = await this.usersRepository.findOneBy({ userId: userId });
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

    return await this.usersRepository.delete(userId);
  }
}
