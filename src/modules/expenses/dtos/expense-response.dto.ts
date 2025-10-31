import { ApiProperty } from '@nestjs/swagger';

export class ExpenseResponseDto {
  @ApiProperty({ description: 'Expense ID' })
  id: number;

  @ApiProperty({ description: 'Expense description' })
  description: string;

  @ApiProperty({ description: 'Expense amount', type: 'number' })
  amount: number;

  @ApiProperty({ description: 'Expense date' })
  date: Date;

  @ApiProperty({ description: 'Category information' })
  category: string;
}

export class ExpenseCategoryTotalDto {
  @ApiProperty({ description: 'Category name' })
  category: string;

  @ApiProperty({ description: 'Total amount for the category', type: 'number' })
  total: number;
}
