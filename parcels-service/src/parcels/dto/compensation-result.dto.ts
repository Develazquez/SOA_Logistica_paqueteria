import { ApiProperty } from '@nestjs/swagger';

export class CompensationResultDto {
  @ApiProperty()
  released: boolean;

  @ApiProperty()
  reservationId: string;

  @ApiProperty()
  status: string;
}
