import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID } from 'class-validator';

export class ReserveRouteDto {
  @ApiProperty({ example: '6508f812-3df5-4a68-94bd-6f2ff1cff530' })
  @IsUUID()
  shipmentId: string;

  @ApiProperty({ example: 'R-MX-CDMX-001' })
  @IsString()
  candidateRouteId: string;

  @ApiProperty({ enum: ['standard', 'express'], example: 'standard' })
  @IsIn(['standard', 'express'])
  serviceLevel: 'standard' | 'express';

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  correlationId: string;
}
