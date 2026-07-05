import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RouteQuoteResultDto {
  @ApiProperty()
  covered: boolean;

  @ApiProperty()
  estimatedDays: number;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  candidateRouteId?: string;

  @ApiProperty()
  capacityAvailable: boolean;
}
