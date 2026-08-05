import { IsValidUsername } from '../decorators/isValidUsername.decorator';
import { IsValidPassword } from '../decorators/isValidPassword.decorator';

export class RegisterDto {
  @IsValidUsername()
  username: string;

  @IsValidPassword()
  password: string;
}
