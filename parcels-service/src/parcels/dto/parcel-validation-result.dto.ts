import { ApiProperty } from '@nestjs/swagger';

export class ParcelValidationResultDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  normalizedWeightKg: number;

  @ApiProperty()
  handlingCategory: string;

  @ApiProperty({ type: [String] })
  restrictions: string[];
}
