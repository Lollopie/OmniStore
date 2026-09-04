import {
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsUUID,
  IsEnum, IsNotEmpty, IsEmail,
} from 'class-validator';
import { WarehouseRole } from '../enum/warehouseRoles.enum'
import { IsValidUsername } from '../decorators/isValidUsername.decorator';

export class WarehouseDto {
  @IsString()
  @MinLength(1, {
    message: 'Warehouse name is too short (minimum 1 character)',
  })
  @MaxLength(64, {
    message: 'Warehouse name is too long (maximum 64 characters)',
  })
  @Matches(/^[A-Za-z\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+$/, {
    message: 'Illegal Warehouse name',
  })
  warehouseName: string;
}
export class WarehouseIDDto {
  @IsString()
  @IsUUID(7, { message: 'Invalid Warehouse ID' })
  warehouseId: string;
}

export class WarehouseUserRoleDto {
  @IsValidUsername()
  username: string;

  @IsNotEmpty()
  @IsEnum(WarehouseRole, { message: 'Invalid role' })
  role: WarehouseRole;
}
export class WarehouseInviteDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty()
  @IsEnum(WarehouseRole, { message: 'Invalid role' })
  role: WarehouseRole;
}
