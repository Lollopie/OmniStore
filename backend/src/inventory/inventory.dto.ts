import {
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsNumberString,
} from 'class-validator';

export class InventoryDto {
  @IsString()
  @MinLength(1, { message: 'Item name is too short (minimum 1 character)' })
  @MaxLength(64, { message: 'Item name is too long (maximum 64 characters)' })
  @Matches(/^[A-Za-z\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+$/, {
    message: 'Illegal Item name',
  })
  itemName: string;
  @IsNumberString(undefined, { message: 'Amount must be numeric' })
  amount: string;
}
