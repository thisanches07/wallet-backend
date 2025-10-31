import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsPositive, Min, Max, IsOptional } from 'class-validator';

export class CreateIncomeAllocationStep1Dto {
  @ApiProperty({
    description: 'Salário fixo mensal',
    example: 5005,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Salário fixo deve ser um número' })
  @IsPositive({ message: 'Salário fixo deve ser positivo' })
  fixedSalary: number;

  @ApiProperty({
    description: 'Receitas extras mensais (freelance, etc)',
    example: 2000,
    minimum: 0,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'Receitas extras devem ser um número' })
  @Min(0, { message: 'Receitas extras devem ser maior ou igual a zero' })
  extraIncome?: number;
}

export class CreateIncomeAllocationStep2Dto {
  @ApiProperty({
    description: 'Percentual para investimentos (0-100)',
    example: 20,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Percentual de investimentos deve ser um número' })
  @Min(0, { message: 'Percentual de investimentos deve ser maior ou igual a 0' })
  @Max(100, { message: 'Percentual de investimentos deve ser menor ou igual a 100' })
  investmentsPercentage: number;

  @ApiProperty({
    description: 'Percentual para gastos (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Percentual de gastos deve ser um número' })
  @Min(0, { message: 'Percentual de gastos deve ser maior ou igual a 0' })
  @Max(100, { message: 'Percentual de gastos deve ser menor ou igual a 100' })
  expensesPercentage: number;
}

export class CreateIncomeAllocationCompleteDto extends CreateIncomeAllocationStep1Dto {
  @ApiProperty({
    description: 'Percentual para investimentos (0-100)',
    example: 20,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Percentual de investimentos deve ser um número' })
  @Min(0, { message: 'Percentual de investimentos deve ser maior ou igual a 0' })
  @Max(100, { message: 'Percentual de investimentos deve ser menor ou igual a 100' })
  investmentsPercentage: number;

  @ApiProperty({
    description: 'Percentual para gastos (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Percentual de gastos deve ser um número' })
  @Min(0, { message: 'Percentual de gastos deve ser maior ou igual a 0' })
  @Max(100, { message: 'Percentual de gastos deve ser menor ou igual a 100' })
  expensesPercentage: number;
}
