import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './address.dto';
import { ParcelInputDto } from './parcel-input.dto';

export class CreateShipmentDto {
  @ApiProperty({ example: 'customer-123' })
  @IsString()
  customerId: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  originAddress: AddressDto;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  destinationAddress: AddressDto;

  @ApiProperty({ type: ParcelInputDto })
  @ValidateNested()
  @Type(() => ParcelInputDto)
  parcel: ParcelInputDto;

  @ApiProperty({ enum: ['standard', 'express'], example: 'standard' })
  @IsIn(['standard', 'express'])
  serviceLevel: 'standard' | 'express';

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  declaredValue: number;

  @ApiProperty({ example: 'order-2026-0001' })
  @IsString()
  idempotencyKey: string;
}
