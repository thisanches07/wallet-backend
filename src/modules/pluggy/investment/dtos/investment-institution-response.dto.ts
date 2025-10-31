import { ApiProperty } from '@nestjs/swagger';

export class InvestmentInstitutionResponseDto {
  @ApiProperty({
    description: 'ID único da instituição',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da instituição financeira',
    example: 'Banco Inter S.A.',
    nullable: true,
  })
  name?: string;

  @ApiProperty({
    description: 'Número identificador da instituição (ex: CNPJ)',
    example: '00.416.968/0001-01',
    nullable: true,
  })
  number?: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do registro',
    example: '2025-01-20T14:45:00Z',
  })
  updatedAt: Date;
}
