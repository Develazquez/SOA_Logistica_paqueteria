import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Length } from 'class-validator';

export class RouteQuoteDto {
  @ApiProperty({ example: '29000' })
  @IsString()
  @Length(4, 10)
  originPostalCode: string;

  @ApiProperty({ example: '01000' })
  @IsString()
  @Length(4, 10)
  destinationPostalCode: string;

  @ApiProperty({ enum: ['standard', 'express'], example: 'standard' })
  @IsIn(['standard', 'express'])
  serviceLevel: 'standard' | 'express';

  @ApiProperty({ example: 'FRAGILE_MEDIUM' })
  @IsString()
  parcelCategory: string;
}
