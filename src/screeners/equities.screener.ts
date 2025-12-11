import { Injectable } from '@nestjs/common';
import { MOMENTUM_PERIODS } from '../common/constants';
import { calculateMomentum } from '../common/utils/momentum.utils';
import { AssetClass } from '../positions/asset-class.enum';
import { EquitiesProvider } from '../providers/equities.provider';
import { RecommendationItem } from './score.types';

@Injectable()
export class EquitiesScreener {
  constructor(private equitiesProvider: EquitiesProvider) {}

  async screenBrazilianEquities(): Promise<RecommendationItem[]> {
    const equities = await this.equitiesProvider.getBrazilianEquities();
    const recommendations: RecommendationItem[] = [];

    for (const equity of equities) {
      const score = this.calculateScore(equity);
      const rationale = this.generateRationale(equity, score);

      const momentum3m = calculateMomentum(
        equity.priceHistory,
        MOMENTUM_PERIODS.SHORT,
      );
      const momentum6m = calculateMomentum(
        equity.priceHistory,
        MOMENTUM_PERIODS.MID,
      );
      const momentum12m = calculateMomentum(
        equity.priceHistory,
        MOMENTUM_PERIODS.LONG,
      );

      recommendations.push({
        id: equity.ticker,
        name: equity.name,
        class: AssetClass.EQUITIES_BR,
        score,
        rationale,
        metrics: {
          price: equity.price,
          market_cap: equity.marketCap,
          volume_24h: equity.volume24h,
          momentum_3m: Math.round(momentum3m * 100) / 100,
          momentum_6m: Math.round(momentum6m * 100) / 100,
          momentum_12m: Math.round(momentum12m * 100) / 100,
          sector: equity.sector,
        },
        source: 'B3/Alpha Vantage',
        updatedAt: new Date().toISOString(),
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private calculateScore(equity: any): number {
    let score = 50; // Base score

    // Market cap score (0-20 points) - prefer large caps for stability
    if (equity.marketCap > 100000000000) {
      // > 100B
      score += 20;
    } else if (equity.marketCap > 50000000000) {
      // > 50B
      score += 15;
    } else if (equity.marketCap > 10000000000) {
      // > 10B
      score += 10;
    }

    // Liquidity score (0-20 points)
    if (equity.volume24h > 200000000) {
      // > 200M
      score += 20;
    } else if (equity.volume24h > 100000000) {
      // > 100M
      score += 15;
    } else if (equity.volume24h > 50000000) {
      // > 50M
      score += 10;
    }

    // Momentum score (0-30 points)
    const momentum3m = calculateMomentum(
      equity.priceHistory,
      MOMENTUM_PERIODS.SHORT,
    );
    const momentum6m = calculateMomentum(
      equity.priceHistory,
      MOMENTUM_PERIODS.MID,
    );
    const momentum12m = calculateMomentum(
      equity.priceHistory,
      MOMENTUM_PERIODS.LONG,
    );

    if (momentum3m > 0 && momentum6m > 0 && momentum12m > 0) {
      score += 30; // All positive momentum
    } else if (momentum3m > 0 && momentum6m > 0) {
      score += 20; // Short and mid term positive
    } else if (momentum3m > 0) {
      score += 10; // At least short term positive
    }

    // Sector bonus (0-10 points)
    if (['Energy', 'Financials', 'Materials'].includes(equity.sector)) {
      score += 10; // Cyclical sectors for growth
    } else if (['Consumer Staples', 'Utilities'].includes(equity.sector)) {
      score += 5; // Defensive sectors
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateRationale(equity: any, score: number): string[] {
    const rationale: string[] = [];

    if (equity.marketCap > 100000000000) {
      rationale.push('Large cap com boa estabilidade');
    }

    if (equity.volume24h > 200000000) {
      rationale.push('Alta liquidez diária');
    }

    const momentum3m = calculateMomentum(
      equity.priceHistory,
      MOMENTUM_PERIODS.SHORT,
    );
    const momentum6m = calculateMomentum(
      equity.priceHistory,
      MOMENTUM_PERIODS.MID,
    );

    if (momentum3m > 5 && momentum6m > 10) {
      rationale.push('Momentum positivo sustentado');
    } else if (momentum3m > 0) {
      rationale.push('Recuperação técnica recente');
    }

    if (['Energy', 'Materials'].includes(equity.sector)) {
      rationale.push('Exposição a commodities');
    } else if (equity.sector === 'Financials') {
      rationale.push('Benefício de alta de juros');
    }

    if (score >= 80) {
      rationale.push('Oportunidade técnica favorável');
    }

    return rationale;
  }
}
