import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactDto {
  @IsString()
  @MinLength(1, { message: 'First Name is too short (minimum 1 character)' })
  @MaxLength(64, { message: 'First Name is too long (maximum 64 characters)' })
  fName: string;
  @IsString()
  @MinLength(1, { message: 'Last Name is too short (minimum 1 character)' })
  @MaxLength(64, { message: 'Last Name is too long (maximum 64 characters)' })
  lName: string;
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;
  @IsString()
  @MinLength(1, { message: 'Message is too short (minimum 1 character)' })
  @MaxLength(1024, { message: 'Message is too long (maximum 1024 characters)' })
  message: string;
}
