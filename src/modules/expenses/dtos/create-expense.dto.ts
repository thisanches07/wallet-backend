import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Expense description',
    example: 'Compra no supermercado',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Expense amount',
    example: 150.5,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Expense date',
    example: '2025-01-15T10:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Category',
    example: 1,
  })
  @IsString()
  category: string;
}
