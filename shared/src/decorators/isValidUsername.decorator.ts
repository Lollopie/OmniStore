import { IsString, MaxLength, Matches, MinLength, IsNotEmpty } from 'class-validator';

export function IsValidUsername() {
  return function (target: object, propertyKey: string) {
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    MinLength(3, { message: 'Username is too short (minimum 3 characters)' })(target, propertyKey);
    MaxLength(30, { message: 'Username is too long (maximum 30 characters)' })(target, propertyKey);
    Matches(/^[a-zA-Z0-9._-]+$/, {
      message:
        'Username can only contain letters, numbers, underscores, dots, or dashes',
    })(target, propertyKey);
  };
}