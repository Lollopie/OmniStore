import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { RegisterDto } from '@shared/dto/register.dto';
import { PasswordService } from '../auth/password.service';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';
@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
  ) {}
  async login(loginData: RegisterDto): Promise<{
    warehouses: { warehouseId: string; name: string; role: string }[] | null;
    userId: string;
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
            const warehouses:
              | {
                  warehouseId: string;
                  name: string;
                  role: string;
                }[]
              | null = await this.userWarehouseRoleService.getUserWarehouses(
              user.userId,
            );
            return {
              warehouses: warehouses,
              userId: user.userId,
              username: user.username,
            };
          }
        }
        throw new UnauthorizedException('Wrong username or password');
      });
  }
}
