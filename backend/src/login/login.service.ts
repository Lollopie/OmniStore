import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { RegisterDto } from '../register/register.dto';
import { PasswordService } from '../auth/password.service';
import { JwtService } from '@nestjs/jwt';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';
@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginData: RegisterDto): Promise<{
    Authorization: string;
    warehouses: { warehouse_id: string; name: string; role: string }[] | null;
    user_id: string;
    username: string;
  }> {
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
            const warehouses =
              await this.userWarehouseRoleService.getUserWarehouses(
                user.user_id,
              );
            const payload = {
              user_id: user.user_id,
              username: user.username,
              activeWarehouseId:
                warehouses && warehouses[0] ? warehouses[0].warehouse_id : '',
              activeRole: warehouses && warehouses[0] ? warehouses[0].role : '',
            };
            return {
              Authorization: await this.jwtService.signAsync(payload),
              warehouses: warehouses,
              user_id: user.user_id,
              username: user.username,
            };
          }
          throw new UnauthorizedException('Wrong or expired token');
        }
        throw new UnauthorizedException('Wrong username or password');
      });
  }
}
