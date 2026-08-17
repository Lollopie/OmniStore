import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { RegisterDto } from '@shared/dto/register.dto';
import { PasswordService } from '../auth/password.service';
import { UserWarehouseRoleService } from '../userWarehouseRole/userWarehouseRole.service';
import { UserOrganizationRoleService } from '../userOrganizationRole/userOrganizationRole.service';
import { UserOrganizationRoleEntity } from '../userOrganizationRole/userOrganizationRole.entity';
@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly userWarehouseRoleService: UserWarehouseRoleService,
    private readonly userOrganizationRoleService: UserOrganizationRoleService,
  ) {}
  async login(loginData: RegisterDto): Promise<{
    warehouses: { warehouseId: string; name: string; role: string }[] | null;
    orgId: string;
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
            const userOrgRole: UserOrganizationRoleEntity | null =
              await this.userOrganizationRoleService.findByUserId(user.userId);
            if (!userOrgRole) {
              throw new UnauthorizedException(
                "User doesn't belong to an organization",
              );
            }
            return {
              warehouses: warehouses,
              orgId: userOrgRole.orgId,
              userId: user.userId,
              username: user.username,
            };
          }
        }
        throw new UnauthorizedException('Wrong username or password');
      });
  }
}
