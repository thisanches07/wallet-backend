import { ApiProperty } from '@nestjs/swagger';

export class MonthlySummaryDto {
  @ApiProperty({ example: 2025, description: 'Ano' })
  year: number;

  @ApiProperty({ example: 7, description: 'Mês (1-12)' })
  month: number;

  @ApiProperty({ example: 5000.00, description: 'Total de receitas do mês' })
  totalIncomes: number;

  @ApiProperty({ example: 3000.00, description: 'Total de despesas do mês' })
  totalExpenses: number;

  @ApiProperty({ example: 2000.00, description: 'Saldo do mês (receitas - despesas)' })
  balance: number;
}

export class YearlySummaryDto {
  @ApiProperty({ example: 2025, description: 'Ano' })
  year: number;

  @ApiProperty({ 
    type: [MonthlySummaryDto], 
    description: 'Resumo mensal do ano' 
  })
  monthlySummaries: MonthlySummaryDto[];

  @ApiProperty({ example: 60000.00, description: 'Total de receitas do ano' })
  totalYearIncomes: number;

  @ApiProperty({ example: 36000.00, description: 'Total de despesas do ano' })
  totalYearExpenses: number;

  @ApiProperty({ example: 24000.00, description: 'Saldo do ano' })
  yearBalance: number;
}