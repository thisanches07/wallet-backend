import { ApiProperty } from '@nestjs/swagger';
import { InvestmentResponseDto } from './investment-response.dto';

export class PaginatedInvestmentResponseDto {
  @ApiProperty({
    description: 'Lista de investimentos',
    type: [InvestmentResponseDto],
  })
  data: InvestmentResponseDto[];

  @ApiProperty({
    description: 'Informações de paginação',
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: 'Total de registros',
        example: 150,
      },
      page: { type: 'number', description: 'Página atual', example: 1 },
      limit: { type: 'number', description: 'Itens por página', example: 10 },
      totalPages: {
        type: 'number',
        description: 'Total de páginas',
        example: 15,
      },
      hasNextPage: {
        type: 'boolean',
        description: 'Tem próxima página',
        example: true,
      },
      hasPrevPage: {
        type: 'boolean',
        description: 'Tem página anterior',
        example: false,
      },
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
