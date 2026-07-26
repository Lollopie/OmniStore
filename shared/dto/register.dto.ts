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
  @MinLength(8, { message: 'Password is too short (minimum 8 characters)' })
  @MaxLength(64, { message: 'Password is too long (maximum 64 characters)' })
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]{8,}$/,
    {
      message:
        'Password must contain a letter, a number, and can include spaces and special characters',
    },
  )
  password: string;
}
