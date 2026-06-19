import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Username is too short (minimum 3 characters)' })
  @MaxLength(30, { message: 'Username is too long (maximum 30 characters)' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, or dashes',
  })
  username: string;
  @IsString()
  password: string;
}
