import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { RegisterDto } from '../register/register.dto';
import { User } from '../user/user.entity';
import { PasswordService } from '../password/password.service';
@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}
  async login(loginData: RegisterDto): Promise<User> {
    return await this.usersService
      .findByUsername(loginData.username)
      .then(async (user) => {
        if (user) {
          if (
            await this.passwordService.verifyPassword(
              loginData.password,
              user.password,
            )
          ) {
            return user;
          }
        }
        throw new BadRequestException('Wrong username or password');
      });
  }
}
