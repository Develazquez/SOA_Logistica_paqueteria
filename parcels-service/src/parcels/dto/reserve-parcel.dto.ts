import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsUUID, ValidateNested } from 'class-validator';
import { ValidateParcelDto } from './validate-parcel.dto';

export class ReserveParcelDto {
  @ApiProperty({ example: '6508f812-3df5-4a68-94bd-6f2ff1cff530' })
  @IsUUID()
  shipmentId: string;

  @ApiProperty({ type: ValidateParcelDto })
  @ValidateNested()
  @Type(() => ValidateParcelDto)
  parcel: ValidateParcelDto;

  @ApiProperty({ example: 'FRAGILE_MEDIUM' })
  @IsString()
  handlingCategory: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  correlationId: string;
}
