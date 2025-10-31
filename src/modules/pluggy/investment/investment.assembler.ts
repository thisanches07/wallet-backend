import { Investment } from '@entities/investiment.entity';
import { InvestmentInstitution } from '@entities/Investment-institution';
import { PluggyInvestmentResponse } from '@modules/types/pluggy-investment-response.interface';
import { InvestmentInstitutionResponseDto } from './dtos/investment-institution-response.dto';
import {
  InvestmentMetadataResponseDto,
  InvestmentResponseDto,
} from './dtos/investment-response.dto';

const typeTranslations = {
  FIXED_INCOME: 'Renda Fixa',
  EQUITY: 'Renda Variável',
  ETF: 'ETF',
  COE: 'COE',
  MUTUAL_FUND: 'Fundo de Investimento',
  SECURITY: 'Previdência',
} as const;

const subtypeTranslations = {
  CRI: 'CRI',
  CRA: 'CRA',
  LCI: 'LCI',
  LCA: 'LCA',
  LC: 'Letra de Câmbio',
  TREASURY: 'Tesouro Direto',
  DEBENTURES: 'Debêntures',
  CDB: 'CDB',
  LIG: 'LIG',
  LF: 'Letra Financeira',

  RETIREMENT: 'Previdência',
  PGBL: 'PGBL',
  VGBL: 'VGBL',

  INVESTMENT_FUND: 'Fundo de Investimento',
  STOCK_FUND: 'Fundo de Ações',
  MULTIMARKET_FUND: 'Fundo Multimercado',
  EXCHANGE_FUND: 'Fundo Cambial',
  FIXED_INCOME_FUND: 'Fundo Renda Fixa',
  FIP_FUND: 'FIP',
  OFFSHORE_FUND: 'Fundo Offshore',
  ETF_FUND: 'Fundo ETF',

  STOCK: 'Ação',
  BDR: 'BDR',
  REAL_ESTATE_FUND: 'FII',
  DERIVATIVES: 'Derivativos',
  OPTION: 'Opção',
  ETF: 'ETF',
  STRUCTURED_NOTE: 'COE',
} as const;

export class InvestmentAssembler {
  /**
   * Converte uma entidade Investment para InvestmentResponseDto
   */
  static toResponseDto(investment: Investment): InvestmentResponseDto {
    return {
      id: investment.id,
      name: investment.name,
      code: investment.code,
      isin: investment.isin,
      number: investment.number,
      owner: investment.owner,
      currencyCode: investment.currencyCode,
      type: typeTranslations[investment.type] || investment.type,
      subtype: subtypeTranslations[investment.subtype] || investment.subtype,
      lastMonthRate: investment.lastMonthRate,
      lastTwelveMonthsRate: investment.lastTwelveMonthsRate,
      annualRate: investment.annualRate,
      date: investment.date,
      value: investment.value,
      quantity: investment.quantity,
      amount: investment.amount,
      taxes: investment.taxes,
      taxes2: investment.taxes2,
      balance: investment.balance,
      dueDate: investment.dueDate,
      rate: investment.rate,
      rateType: investment.rateType,
      fixedAnnualRate: investment.fixedAnnualRate,
      issuer: investment.issuer,
      issueDate: investment.issueDate,
      amountProfit: investment.amountProfit,
      amountWithdrawal: investment.amountWithdrawal,
      amountOriginal: investment.amountOriginal,
      status: investment.status,
      metadata: investment.metadata as InvestmentMetadataResponseDto,
      providerId: investment.providerId,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
      institution: investment.institution
        ? this.toInstitutionResponseDto(investment.institution)
        : undefined,
      institutionId: investment.institutionId,
      pluggyItemId: investment.pluggyItemId,
    };
  }

  /**
   * Converte uma lista de entidades Investment para lista de InvestmentResponseDto
   */
  static toResponseDtoList(investments: Investment[]): InvestmentResponseDto[] {
    return investments.map((investment) => this.toResponseDto(investment));
  }

  /**
   * Converte uma entidade InvestmentInstitution para InvestmentInstitutionResponseDto
   */
  static toInstitutionResponseDto(
    institution: InvestmentInstitution,
  ): InvestmentInstitutionResponseDto {
    return {
      id: institution.id,
      name: institution.name,
      number: institution.number,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
    };
  }

  /**
   * Converte uma PluggyInvestmentResponse para dados de Investment entity
   * (usado principalmente no service para criar novas entidades)
   */
  static fromPluggyResponseToEntityData(
    pluggyResponse: PluggyInvestmentResponse,
    pluggyItem: any,
    institution?: InvestmentInstitution,
  ): Partial<Investment> {
    return {
      name: pluggyResponse.name,
      code: pluggyResponse.code,
      isin: pluggyResponse.isin,
      number: pluggyResponse.number,
      owner: pluggyResponse.owner,
      currencyCode: pluggyResponse.currencyCode,
      type: pluggyResponse.type as any, // TypeScript conversion
      subtype: pluggyResponse.subtype as any, // TypeScript conversion
      lastMonthRate: pluggyResponse.lastMonthRate,
      lastTwelveMonthsRate: pluggyResponse.lastTwelveMonthsRate,
      annualRate: pluggyResponse.annualRate,
      date: pluggyResponse.date ? new Date(pluggyResponse.date) : undefined,
      value: pluggyResponse.value,
      quantity: pluggyResponse.quantity,
      amount: pluggyResponse.amount,
      taxes: pluggyResponse.taxes,
      taxes2: pluggyResponse.taxes2,
      balance: pluggyResponse.balance,
      dueDate: pluggyResponse.dueDate
        ? new Date(pluggyResponse.dueDate)
        : undefined,
      rate: pluggyResponse.rate,
      rateType: pluggyResponse.rateType,
      fixedAnnualRate: pluggyResponse.fixedAnnualRate,
      issuer: pluggyResponse.issuer,
      issueDate: pluggyResponse.issueDate
        ? new Date(pluggyResponse.issueDate)
        : undefined,
      amountProfit: pluggyResponse.amountProfit,
      amountWithdrawal: pluggyResponse.amountWithdrawal,
      amountOriginal: pluggyResponse.amountOriginal,
      status: pluggyResponse.status,
      metadata: pluggyResponse.metadata,
      providerId: pluggyResponse.providerId,
      pluggyItem,
      institution,
    };
  }

  /**
   * Converte múltiplas PluggyInvestmentResponse para dados de Investment entities
   */
  static fromPluggyResponseListToEntityData(
    pluggyResponses: PluggyInvestmentResponse[],
    pluggyItem: any,
    institutionMap: Map<string, InvestmentInstitution>,
  ): Partial<Investment>[] {
    return pluggyResponses.map((pluggyResponse) =>
      this.fromPluggyResponseToEntityData(
        pluggyResponse,
        pluggyItem,
        pluggyResponse.institution?.number
          ? institutionMap.get(pluggyResponse.institution.number)
          : undefined,
      ),
    );
  }
}
