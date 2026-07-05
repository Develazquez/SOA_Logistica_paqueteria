import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CancelShipmentDto {
  @ApiProperty({ example: 'Cliente solicito cancelacion antes de recoleccion.' })
  @IsString()
  @MinLength(8)
  reason: string;

  @ApiProperty({ example: 'operator-1' })
  @IsString()
  requestedBy: string;
}
