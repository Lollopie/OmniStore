import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { UsersService } from '../user/users.service';
import { RegisterDto } from './register.dto';
import { PasswordService } from '../auth/password.service';
@Injectable()
export class RegisterService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}
  async register(registerData: RegisterDto): Promise<User> {
    return await this.usersService
      .findByUsername(registerData.username)
      .then(async (user) => {
        if (user) {
          throw new BadRequestException('Username already exists');
        }
        registerData.password = await this.passwordService.hashPassword(
          registerData.password,
        );
        return await this.usersService.createUser(registerData);
      });
  }
}
