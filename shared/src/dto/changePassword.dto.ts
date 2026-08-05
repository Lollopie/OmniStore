import { IsValidPassword } from '../decorators/isValidPassword.decorator';

export class ChangePasswordDto {
  @IsValidPassword()
  password: string;

  @IsValidPassword()
  newPassword: string;

  @IsValidPassword()
  confirmPassword: string;
}
