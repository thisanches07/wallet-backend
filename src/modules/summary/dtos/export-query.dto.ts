import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ExportQueryDto {
  @ApiProperty({
    description: 'Ano para exportação',
    example: 2025,
    minimum: 2000,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2000, { message: 'Ano deve ser maior ou igual a 2000' })
  @Max(2100, { message: 'Ano deve ser menor ou igual a 2100' })
  year: number;

  @ApiProperty({
    description: 'Mês para exportação (1-12)',
    example: 7,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  month: number;
}
