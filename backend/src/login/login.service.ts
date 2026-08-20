import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { RegisterDto } from '@shared/dto/register.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}
  async login(loginData: RegisterDto) {
    return await this.usersService
      .findByUsername(loginData.username)
      .then(async (user) => {
        if (user) {
          if (
            await this.authService.verifyPassword(
              loginData.password,
              user.password,
            )
          ) {
            return await this.usersService.getCookieInfo(user.username);
          }
        }
        throw new UnauthorizedException('Wrong username or password');
      });
  }
}
