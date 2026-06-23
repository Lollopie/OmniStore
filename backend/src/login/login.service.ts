import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { RegisterDto } from '../register/register.dto';
import { PasswordService } from '../auth/password.service';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginData: RegisterDto): Promise<{ Authorization: string }> {
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
            const payload = { user_id: user.user_id, username: user.username };
            return {
              Authorization: await this.jwtService.signAsync(payload),
            };
          }
          throw new UnauthorizedException('Wrong or expired token');
        }
        throw new UnauthorizedException('Wrong username or password');
      });
  }
}
