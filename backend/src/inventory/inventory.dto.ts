import {
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryDto {
  @IsString()
  @MinLength(1, { message: 'Item name is too short (minimum 1 character)' })
  @MaxLength(64, { message: 'Item name is too long (maximum 64 characters)' })
  @Matches(/^[A-Za-z\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+$/, {
    message: 'Illegal Item name',
  })
  name: string;
  @Type(() => Number)
  @IsInt()
  amount: string;
}
