import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class YearlyExportQueryDto {
  @ApiProperty({
    description: 'Ano para análise de evolução',
    example: 2025,
    minimum: 2000,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2000, { message: 'Ano deve ser maior ou igual a 2000' })
  @Max(2100, { message: 'Ano deve ser menor ou igual a 2100' })
  year: number;
}
