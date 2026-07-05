import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DemoTokenDto {
  @ApiProperty({ example: 'user-demo-1' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: 'Viviana Lopez' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'operator' })
  @IsOptional()
  @IsString()
  role?: string;
}
