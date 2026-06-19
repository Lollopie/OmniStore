import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { UsersService } from '../user/users.service';
import { RegisterDto } from './register.dto';

@Injectable()
export class RegisterService {
  constructor(private readonly usersService: UsersService) {}
  async register(registerData: RegisterDto): Promise<User> {
    return await this.usersService
      .findByUsername(registerData.username)
      .then((user) => {
        if (user) {
          throw new BadRequestException('Username already exists');
        }
        const userObject = {
          id: 1,
          username: registerData.username,
          password: registerData.password,
        };
        return this.usersService.createUser(userObject);
      });
  }
}
