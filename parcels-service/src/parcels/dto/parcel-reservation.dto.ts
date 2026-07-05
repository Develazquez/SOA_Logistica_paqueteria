import { ApiProperty } from '@nestjs/swagger';

export class ParcelReservationDto {
  @ApiProperty()
  reservationId: string;

  @ApiProperty()
  labelCode: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty({ example: 'RESERVED' })
  status: string;
}
