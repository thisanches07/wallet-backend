import { Injectable } from '@nestjs/common';
import { CryptoScreener } from '../screeners/crypto.screener';
import { EquitiesScreener } from '../screeners/equities.screener';
import { FiisScreener } from '../screeners/fiis.screener';
import { IntlScreener } from '../screeners/intl.screener';
import { RecommendationItem } from '../screeners/score.types';
import { TreasuryScreener } from '../screeners/treasury.screener';
import {
  InvestmentHorizon,
  RecommendationClass,
  RiskProfile,
} from './dtos/recommendations.query.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    private treasuryScreener: TreasuryScreener,
    private equitiesScreener: EquitiesScreener,
    private fiisScreener: FiisScreener,
    private intlScreener: IntlScreener,
    private cryptoScreener: CryptoScreener,
  ) {}

  async getRecommendations(
    assetClass?: RecommendationClass,
    horizon?: InvestmentHorizon,
    risk?: RiskProfile,
    limit = 10,
  ): Promise<RecommendationItem[]> {
    let recommendations: RecommendationItem[] = [];

    if (!assetClass || assetClass === RecommendationClass.TREASURY) {
      const treasuryRecs = await this.treasuryScreener.screenTreasuryBonds();
      recommendations.push(...treasuryRecs);
    }

    if (!assetClass || assetClass === RecommendationClass.EQUITY_BR) {
      const equityRecs = await this.equitiesScreener.screenBrazilianEquities();
      recommendations.push(...equityRecs);
    }

    if (!assetClass || assetClass === RecommendationClass.INTL) {
      const intlRecs = await this.intlScreener.screenInternationalETFs();
      recommendations.push(...intlRecs);
    }

    if (!assetClass || assetClass === RecommendationClass.FII) {
      const fiiRecs = await this.fiisScreener.screenRealEstateFunds();
      recommendations.push(...fiiRecs);
    }

    if (!assetClass || assetClass === RecommendationClass.CRYPTO) {
      const cryptoRecs = await this.cryptoScreener.screenCryptocurrencies();
      recommendations.push(...cryptoRecs);
    }

    // Apply risk and horizon filters
    recommendations = this.applyRiskFilter(recommendations, risk);
    recommendations = this.applyHorizonFilter(recommendations, horizon);

    // Sort by score and limit results
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, limit);
  }

  private applyRiskFilter(
    recommendations: RecommendationItem[],
    risk?: RiskProfile,
  ): RecommendationItem[] {
    if (!risk) return recommendations;

    return recommendations.filter((rec) => {
      if (risk === RiskProfile.CONSERVATIVE) {
        // Conservative: only fixed income and some defensive assets
        return (
          rec.class === 'fixed_income' ||
          (rec.class === 'fiis' && rec.score >= 70)
        );
      } else if (risk === RiskProfile.MODERATE) {
        // Moderate: exclude only very risky crypto
        return rec.class !== 'crypto' || rec.score >= 70;
      } else {
        // Aggressive: all assets
        return true;
      }
    });
  }

  private applyHorizonFilter(
    recommendations: RecommendationItem[],
    horizon?: InvestmentHorizon,
  ): RecommendationItem[] {
    if (!horizon) return recommendations;

    return recommendations.filter((rec) => {
      if (horizon === InvestmentHorizon.SHORT) {
        // Short term: prefer liquidity and low duration
        return (
          rec.class === 'fixed_income' &&
          (rec.metrics.duration_y === null ||
            (typeof rec.metrics.duration_y === 'number' &&
              rec.metrics.duration_y <= 3))
        );
      } else if (horizon === InvestmentHorizon.MID) {
        // Mid term: balanced approach
        return rec.class !== 'crypto' || rec.score >= 70;
      } else {
        // Long term: all assets, prefer growth potential
        return true;
      }
    });
  }
}
