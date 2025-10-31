import { ApiProperty } from '@nestjs/swagger';

export class IncomeResponseDto {
  @ApiProperty({ description: 'Income ID' })
  id: number;

  @ApiProperty({ description: 'Income description' })
  description: string;

  @ApiProperty({ description: 'Income amount', type: 'number' })
  amount: number;

  @ApiProperty({ description: 'Income start date' })
  startDate: Date;

  @ApiProperty({ description: 'Income end date', required: false })
  endDate?: Date;

  @ApiProperty({
    description: 'Category information',
  })
  category: string;
}
