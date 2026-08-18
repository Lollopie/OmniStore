import { BadRequestException, Injectable } from '@nestjs/common';
import { UserEntity } from '../user/user.entity';
import { UsersService } from '../user/users.service';
import { RegisterDto } from '@shared/dto/register.dto';
import { AuthService } from '../auth/auth.service';
@Injectable()
export class RegisterService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}
  async register(registerData: RegisterDto): Promise<UserEntity> {
    return await this.usersService
      .findByUsername(registerData.username)
      .then(async (user) => {
        if (user) {
          throw new BadRequestException('Username already exists');
        }
        registerData.password = await this.authService.hashPassword(
          registerData.password,
        );
        return await this.usersService.createUser(registerData);
      });
  }
}
