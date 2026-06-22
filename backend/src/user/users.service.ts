import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { RegisterDto } from '../register/register.dto';

@Injectable()
export class UsersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find();
  }

  findOne(user_id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ user_id });
  }
  findByUsername(userName: string): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ username: userName });
  }
  async createUser(user: RegisterDto) {
    const newUser = this.usersRepository.create(user);
    return await this.usersRepository.save(newUser);
  }
  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
