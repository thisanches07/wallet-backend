import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum RecommendationClass {
  TREASURY = 'treasury',
  EQUITY_BR = 'equity_br',
  INTL = 'intl',
  FII = 'fii',
  CRYPTO = 'crypto',
}

export enum InvestmentHorizon {
  SHORT = 'short',
  MID = 'mid',
  LONG = 'long',
}

export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

export class RecommendationsQueryDto {
  @ApiPropertyOptional({ enum: RecommendationClass })
  @IsOptional()
  @IsEnum(RecommendationClass)
  class?: RecommendationClass;

  @ApiPropertyOptional({ enum: InvestmentHorizon })
  @IsOptional()
  @IsEnum(InvestmentHorizon)
  horizon?: InvestmentHorizon;

  @ApiPropertyOptional({ enum: RiskProfile })
  @IsOptional()
  @IsEnum(RiskProfile)
  risk?: RiskProfile;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
