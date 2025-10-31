import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateExpenseDto {
  @ApiProperty({
    description: 'Expense description',
    example: 'Compra no supermercado',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Expense amount',
    example: 150.5,
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({
    description: 'Expense date',
    example: '2025-01-15T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Category ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;
}
