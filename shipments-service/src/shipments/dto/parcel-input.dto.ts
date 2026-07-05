import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, Max, Min } from 'class-validator';

export class ParcelInputDto {
  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(0.1)
  @Max(30)
  weightKg: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(1)
  @Max(120)
  lengthCm: number;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(1)
  @Max(120)
  widthCm: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  @Max(120)
  heightCm: number;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  contentType: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  fragile: boolean;
}
