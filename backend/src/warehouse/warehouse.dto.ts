import {
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Role } from '../roles/roles.enum';

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
  name: string;
}
export class WarehouseIDDto {
  @IsString()
  @IsUUID(7, { message: 'Invalid Warehouse ID' })
  id: string;
}

export class WarehouseUserRoleDto {
  @IsString()
  @MinLength(3, { message: 'Invalid Username' })
  @MaxLength(30, { message: 'Invalid Username' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Invalid Username',
  })
  username: string;

  @IsEnum(Role, { message: 'Invalid role' })
  role: Role;
}
