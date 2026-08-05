import { IsString, MaxLength, Matches, MinLength, IsNotEmpty } from 'class-validator';

export function IsValidPassword() {
  return function (target: object, propertyKey: string) {
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    MinLength(8, { message: 'Password is too short (minimum 8 characters)' })(target, propertyKey);
    MaxLength(64, { message: 'Password is too long (maximum 64 characters)' })(target, propertyKey);
    Matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+$/,
      {
        message:
          'Password must contain a letter, a number, and can include spaces and special characters',
      }
    )(target, propertyKey);
  }
}