import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateIncomeDto {
  @ApiProperty({
    description: 'Income description',
    example: 'Salário mensal',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Income amount',
    example: 5000.0,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Income start date',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Income end date (optional)',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Category ID',
    example: 1,
  })
  @ApiProperty({
    description: 'Income end date (optional)',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsString()
  category?: string;
}
