import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShipmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'FAILED_VALIDATION', 'FAILED_COMPENSATED', 'CANCELLED'] })
  status: string;

  @ApiPropertyOptional()
  trackingCode?: string;

  @ApiPropertyOptional()
  routeReservationId?: string;

  @ApiPropertyOptional()
  parcelReservationId?: string;

  @ApiProperty()
  correlationId: string;

  @ApiPropertyOptional()
  failureReason?: string;
}
