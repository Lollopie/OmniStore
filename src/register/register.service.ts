import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { UsersService } from '../user/users.service';
import { RegisterDto } from './register.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class RegisterService {
  constructor(private readonly usersService: UsersService) {}
  async register(registerData: RegisterDto): Promise<User> {
    return await this.usersService
      .findByUsername(registerData.username)
      .then(async (user) => {
        if (user) {
          throw new BadRequestException('Username already exists');
        }
        const saltOrRounds = 10;
        registerData.password = await bcrypt.hash(
          registerData.password,
          saltOrRounds,
        );
        return await this.usersService.createUser(registerData);
      });
  }
}
