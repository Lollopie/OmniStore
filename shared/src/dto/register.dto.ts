import { IsValidUsername } from '../decorators/isValidUsername.decorator';
import { IsValidPassword } from '../decorators/isValidPassword.decorator';
import {
  IsString, IsNotEmpty, IsEmail,
} from 'class-validator';
export class RegisterDto {
  @IsValidUsername()
  username: string;

  @IsValidPassword()
  password: string;
}

export class RegisterEmailDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;
}
