import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private dataSource: DataSource,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }
  findByUsername(userName: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username: userName });
  }
  async createUser(user: User) {
    return await this.usersRepository.save(user);
  }
  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
