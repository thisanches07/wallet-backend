import { ApiProperty } from '@nestjs/swagger';
import { InvestmentSubType } from 'enum/investment-subtype.enum';
import { InvestmentType } from 'enum/investment-type.enum';
import { InvestmentInstitutionResponseDto } from './investment-institution-response.dto';

export class InvestmentMetadataResponseDto {
  @ApiProperty({
    description: 'Regime tributário do investimento',
    example: 'PROGRESSIVO',
    nullable: true,
  })
  taxRegime?: string;

  @ApiProperty({
    description: 'Número da proposta',
    example: 'PROP-123456',
    nullable: true,
  })
  proposalNumber?: string;

  @ApiProperty({
    description: 'Número do processo',
    example: 'PROC-789012',
    nullable: true,
  })
  processNumber?: string;

  @ApiProperty({
    description: 'Nome do fundo',
    example: 'Fundo de Investimento XYZ',
    nullable: true,
  })
  fundName?: string;

  @ApiProperty({
    description: 'Informações da seguradora',
    nullable: true,
    type: 'object',
    properties: {
      cnpj: { type: 'string', example: '12.345.678/0001-90' },
      name: { type: 'string', example: 'Seguradora ABC S.A.' },
    },
  })
  insurer?: {
    cnpj: string;
    name: string;
  };
}

export class InvestmentResponseDto {
  @ApiProperty({
    description: 'ID único do investimento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do investimento',
    example: 'Tesouro IPCA+ 2029',
  })
  name: string;

  @ApiProperty({
    description: 'Código do investimento',
    example: 'IPCA29',
    nullable: true,
  })
  code?: string;

  @ApiProperty({
    description: 'Código ISIN do investimento',
    example: 'BRSTNCLTN2K8',
    nullable: true,
  })
  isin?: string;

  @ApiProperty({
    description: 'Número identificador',
    example: '123456',
    nullable: true,
  })
  number?: string;

  @ApiProperty({
    description: 'Proprietário do investimento',
    example: 'João da Silva Santos',
    nullable: true,
  })
  owner?: string;

  @ApiProperty({
    description: 'Código da moeda',
    example: 'BRL',
    nullable: true,
  })
  currencyCode?: string;

  @ApiProperty({
    description: 'Tipo do investimento',
    enum: InvestmentType,
    example: InvestmentType.FIXED_INCOME,
  })
  type: string | InvestmentType;

  @ApiProperty({
    description: 'Subtipo do investimento',
    enum: InvestmentSubType,
    example: InvestmentSubType.TREASURY,
    nullable: true,
  })
  subtype?: string | InvestmentSubType;

  @ApiProperty({
    description: 'Taxa de retorno do último mês (%)',
    example: 1.25,
    nullable: true,
  })
  lastMonthRate?: number;

  @ApiProperty({
    description: 'Taxa de retorno dos últimos 12 meses (%)',
    example: 12.5,
    nullable: true,
  })
  lastTwelveMonthsRate?: number;

  @ApiProperty({
    description: 'Taxa anual (%)',
    example: 11.75,
    nullable: true,
  })
  annualRate?: number;

  @ApiProperty({
    description: 'Data de referência do investimento',
    example: '2025-01-20T00:00:00Z',
    nullable: true,
  })
  date?: Date;

  @ApiProperty({
    description: 'Valor unitário',
    example: 1250.5,
    nullable: true,
  })
  value?: number;

  @ApiProperty({
    description: 'Quantidade de cotas/ações',
    example: 100,
    nullable: true,
  })
  quantity?: number;

  @ApiProperty({
    description: 'Valor total do investimento',
    example: 125050.0,
  })
  amount: number;

  @ApiProperty({
    description: 'Valor dos impostos',
    example: 1250.5,
    nullable: true,
  })
  taxes?: number;

  @ApiProperty({
    description: 'Valor adicional de impostos',
    example: 250.25,
    nullable: true,
  })
  taxes2?: number;

  @ApiProperty({
    description: 'Saldo atual',
    example: 123549.25,
    nullable: true,
  })
  balance?: number;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2029-05-15T00:00:00Z',
    nullable: true,
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'Taxa atual (%)',
    example: 5.75,
    nullable: true,
  })
  rate?: number;

  @ApiProperty({
    description: 'Tipo da taxa',
    example: 'SELIC',
    nullable: true,
  })
  rateType?: string;

  @ApiProperty({
    description: 'Taxa anual fixa (%)',
    example: 6.0,
    nullable: true,
  })
  fixedAnnualRate?: number;

  @ApiProperty({
    description: 'Emissor do investimento',
    example: 'Tesouro Nacional',
    nullable: true,
  })
  issuer?: string;

  @ApiProperty({
    description: 'Data de emissão',
    example: '2020-01-15T00:00:00Z',
    nullable: true,
  })
  issueDate?: Date;

  @ApiProperty({
    description: 'Valor do lucro',
    example: 5050.0,
    nullable: true,
  })
  amountProfit?: number;

  @ApiProperty({
    description: 'Valor de retiradas',
    example: 0,
    nullable: true,
  })
  amountWithdrawal?: number;

  @ApiProperty({
    description: 'Valor original investido',
    example: 120000.0,
    nullable: true,
  })
  amountOriginal?: number;

  @ApiProperty({
    description: 'Status do investimento',
    example: 'ACTIVE',
    nullable: true,
  })
  status?: string;

  @ApiProperty({
    description: 'Metadados adicionais do investimento',
    type: InvestmentMetadataResponseDto,
    nullable: true,
  })
  metadata?: InvestmentMetadataResponseDto;

  @ApiProperty({
    description: 'ID do provedor',
    example: 'PLUGGY_PROVIDER_123',
    nullable: true,
  })
  providerId?: string;

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

  @ApiProperty({
    description: 'Informações da instituição financeira',
    type: InvestmentInstitutionResponseDto,
    nullable: true,
  })
  institution?: InvestmentInstitutionResponseDto;

  @ApiProperty({
    description: 'ID da instituição financeira',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  institutionId?: string;

  @ApiProperty({
    description: 'ID do item Pluggy associado',
    example: 123,
  })
  pluggyItemId: number;
}
