import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DateFilterDto {
  @ApiPropertyOptional({
    description: 'Month to filter (0-11)',
    example: 5,
    minimum: 0,
    maximum: 11,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  @Max(11)
  month?: number;

  @ApiPropertyOptional({
    description: 'Year to filter',
    example: 2025,
    minimum: 1900,
    maximum: 2100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
}
