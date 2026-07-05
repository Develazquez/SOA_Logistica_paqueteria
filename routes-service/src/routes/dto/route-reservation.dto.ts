import { ApiProperty } from '@nestjs/swagger';

export class RouteReservationDto {
  @ApiProperty()
  reservationId: string;

  @ApiProperty()
  routeId: string;

  @ApiProperty()
  courierZone: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty({ example: 'RESERVED' })
  status: string;
}
