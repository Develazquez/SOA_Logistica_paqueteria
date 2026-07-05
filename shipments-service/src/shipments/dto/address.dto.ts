import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Av. Central 123' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Tuxtla Gutierrez' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Chiapas' })
  @IsString()
  state: string;

  @ApiProperty({ example: '29000' })
  @IsString()
  @Length(4, 10)
  postalCode: string;

  @ApiProperty({ example: 'MX' })
  @IsString()
  @Length(2, 2)
  country: string;
}
