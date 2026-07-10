import {
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class WarehouseDto {
  @IsString()
  @MinLength(1, {
    message: 'Warehouse name is too short (minimum 1 character)',
  })
  @MaxLength(64, {
    message: 'Warehouse name is too long (maximum 64 characters)',
  })
  @Matches(/^[A-Za-z\d\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]+$/, {
    message: 'Illegal Warehouse name',
  })
  name: string;
}
export class WarehouseIDDto {
  @IsString()
  @IsUUID(7, { message: 'Invalid Warehouse ID' })
  id: string;
}
