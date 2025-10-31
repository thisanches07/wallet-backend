import { ApiProperty } from '@nestjs/swagger';

export class IncomeAllocationResponseDto {
  @ApiProperty({
    description: 'ID da alocação',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Salário fixo mensal',
    example: 5005,
  })
  fixedSalary: number;

  @ApiProperty({
    description: 'Receitas extras mensais',
    example: 2000,
  })
  extraIncome: number;

  @ApiProperty({
    description: 'Renda total mensal',
    example: 7005,
  })
  totalMonthlyIncome: number;

  @ApiProperty({
    description: 'Percentual para investimentos',
    example: 20,
  })
  investmentsPercentage: number;

  @ApiProperty({
    description: 'Percentual para gastos',
    example: 70,
  })
  expensesPercentage: number;

  @ApiProperty({
    description: 'Percentual para reserva livre',
    example: 10,
  })
  leisurePercentage: number;

  @ApiProperty({
    description: 'Valor para investimentos',
    example: 1401,
  })
  investmentsAmount: number;

  @ApiProperty({
    description: 'Valor para gastos',
    example: 4903.5,
  })
  expensesAmount: number;

  @ApiProperty({
    description: 'Valor para reserva livre',
    example: 700.5,
  })
  leisureAmount: number;

  @ApiProperty({
    description: 'Se a alocação está ativa',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-07-19T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-07-19T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class IncomeAllocationPreviewDto {
  @ApiProperty({
    description: 'Renda total mensal',
    example: 7005,
  })
  totalMonthlyIncome: number;

  @ApiProperty({
    description: 'Valor para investimentos',
    example: 1401,
  })
  investmentsAmount: number;

  @ApiProperty({
    description: 'Valor para gastos',
    example: 4903.5,
  })
  expensesAmount: number;

  @ApiProperty({
    description: 'Valor para reserva livre',
    example: 700.5,
  })
  leisureAmount: number;

  @ApiProperty({
    description: 'Percentual para investimentos',
    example: 20,
  })
  investmentsPercentage: number;

  @ApiProperty({
    description: 'Percentual para gastos',
    example: 70,
  })
  expensesPercentage: number;

  @ApiProperty({
    description: 'Percentual para reserva livre',
    example: 10,
  })
  leisurePercentage: number;
}
