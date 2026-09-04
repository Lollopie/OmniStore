import { IsValidUsername } from '../decorators/isValidUsername.decorator';
import { IsValidPassword } from '../decorators/isValidPassword.decorator';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { OrganizationRole } from '../enum/organizationRoles.enum';

export class OrganizationDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  ownerEmail: string;

  @IsValidUsername()
  ownerUsername: string;

  @IsValidPassword()
  ownerPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, {
    message: 'Organization name is too short (minimum 1 character)',
  })
  @MaxLength(64, {
    message: 'Organization name is too long (maximum 64 characters)',
  })
  @Matches(/^[A-Za-z\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+$/, {
    message: 'Illegal Organization name',
  })
  name: string;
}
export class OrganizationUpdateRoleDto {
  @IsValidUsername()
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(OrganizationRole, { message: 'Invalid role' })
  role: string;
}
