import { Injectable } from '@nestjs/common';
import { AssetClass } from '../positions/asset-class.enum';
import { RecommendationItem } from './score.types';

@Injectable()
export class IntlScreener {
  constructor() {}

  // TODO: Replace with real international ETFs data
  async screenInternationalETFs(): Promise<RecommendationItem[]> {
    // Stub data for Brazilian-listed international ETFs
    const etfs = [
      {
        ticker: 'IVVB11',
        name: 'iShares S&P 500',
        underlying: 'S&P 500',
        expense_ratio: 0.04,
        aum: 2500000000,
        volume24h: 25000000,
        ytd_return: 12.5,
      },
      {
        ticker: 'GOLD11',
        name: 'iShares Gold',
        underlying: 'Gold',
        expense_ratio: 0.4,
        aum: 800000000,
        volume24h: 15000000,
        ytd_return: 8.2,
      },
      {
        ticker: 'WRLD11',
        name: 'iShares MSCI World',
        underlying: 'MSCI World',
        expense_ratio: 0.6,
        aum: 500000000,
        volume24h: 8000000,
        ytd_return: 10.8,
      },
    ];

    const recommendations: RecommendationItem[] = [];

    for (const etf of etfs) {
      const score = this.calculateScore(etf);
      const rationale = this.generateRationale(etf, score);

      recommendations.push({
        id: etf.ticker,
        name: etf.name,
        class: AssetClass.INTL,
        score,
        rationale,
        metrics: {
          underlying: etf.underlying,
          expense_ratio: etf.expense_ratio,
          aum: etf.aum,
          volume_24h: etf.volume24h,
          ytd_return: etf.ytd_return,
        },
        source: 'B3/Blackrock',
        updatedAt: new Date().toISOString(),
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private calculateScore(etf: any): number {
    let score = 50; // Base score

    // Performance score (0-25 points)
    if (etf.ytd_return > 15) {
      score += 25;
    } else if (etf.ytd_return > 10) {
      score += 20;
    } else if (etf.ytd_return > 5) {
      score += 15;
    } else if (etf.ytd_return > 0) {
      score += 10;
    }

    // Expense ratio score (0-20 points) - lower is better
    if (etf.expense_ratio < 0.1) {
      score += 20;
    } else if (etf.expense_ratio < 0.2) {
      score += 15;
    } else if (etf.expense_ratio < 0.5) {
      score += 10;
    } else if (etf.expense_ratio < 1.0) {
      score += 5;
    }

    // AUM score (0-20 points)
    if (etf.aum > 2000000000) {
      score += 20;
    } else if (etf.aum > 1000000000) {
      score += 15;
    } else if (etf.aum > 500000000) {
      score += 10;
    }

    // Liquidity score (0-20 points)
    if (etf.volume24h > 20000000) {
      score += 20;
    } else if (etf.volume24h > 10000000) {
      score += 15;
    } else if (etf.volume24h > 5000000) {
      score += 10;
    }

    // Underlying index bonus (0-15 points)
    if (etf.underlying === 'S&P 500') {
      score += 15; // Core US market
    } else if (etf.underlying === 'MSCI World') {
      score += 12; // Global diversification
    } else if (etf.underlying === 'Gold') {
      score += 8; // Hedge asset
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateRationale(etf: any, score: number): string[] {
    const rationale: string[] = [];

    if (etf.expense_ratio < 0.1) {
      rationale.push('Taxa de administração muito baixa');
    } else if (etf.expense_ratio < 0.5) {
      rationale.push('Taxa de administração competitiva');
    }

    if (etf.ytd_return > 10) {
      rationale.push('Performance sólida no ano');
    }

    if (etf.aum > 1000000000) {
      rationale.push('ETF consolidado com bom patrimônio');
    }

    if (etf.volume24h > 15000000) {
      rationale.push('Liquidez adequada no mercado brasileiro');
    }

    if (etf.underlying === 'S&P 500') {
      rationale.push('Exposição ao core do mercado americano');
    } else if (etf.underlying === 'MSCI World') {
      rationale.push('Diversificação global desenvolvida');
    } else if (etf.underlying === 'Gold') {
      rationale.push('Hedge contra inflação e volatilidade');
    }

    if (score >= 80) {
      rationale.push('Excelente opção para internacionalização');
    }

    return rationale;
  }
}
