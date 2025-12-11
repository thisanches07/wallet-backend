import { Injectable } from '@nestjs/common';
import { AssetClass } from '../positions/asset-class.enum';
import { FundsProvider } from '../providers/funds.provider';
import { RecommendationItem } from './score.types';

@Injectable()
export class FiisScreener {
  constructor(private fundsProvider: FundsProvider) {}

  async screenRealEstateFunds(): Promise<RecommendationItem[]> {
    const fiis = await this.fundsProvider.getRealEstateFunds();
    const recommendations: RecommendationItem[] = [];

    for (const fii of fiis) {
      const score = this.calculateScore(fii);
      const rationale = this.generateRationale(fii, score);

      recommendations.push({
        id: fii.ticker,
        name: fii.name,
        class: AssetClass.FIIS,
        score,
        rationale,
        metrics: {
          price: fii.price,
          dividend_yield_12m: fii.dividendYield12m,
          pvp: fii.pvp || null,
          volume_24h: fii.volume24h,
          net_worth: fii.netWorth,
          segment: fii.segment,
        },
        source: 'B3/FundsExplorer',
        updatedAt: new Date().toISOString(),
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private calculateScore(fii: any): number {
    let score = 50; // Base score

    // Dividend yield score (0-30 points)
    if (fii.dividendYield12m > 10) {
      score += 30;
    } else if (fii.dividendYield12m > 8) {
      score += 25;
    } else if (fii.dividendYield12m > 6) {
      score += 20;
    } else if (fii.dividendYield12m > 4) {
      score += 10;
    }

    // P/VP score (0-20 points) - prefer trading below book value
    if (fii.pvp && fii.pvp < 0.9) {
      score += 20;
    } else if (fii.pvp && fii.pvp < 1.0) {
      score += 15;
    } else if (fii.pvp && fii.pvp < 1.1) {
      score += 10;
    }

    // Liquidity score (0-20 points)
    if (fii.volume24h > 2000000) {
      score += 20;
    } else if (fii.volume24h > 1000000) {
      score += 15;
    } else if (fii.volume24h > 500000) {
      score += 10;
    }

    // Size/AUM score (0-15 points)
    if (fii.netWorth > 1000000000) {
      // > 1B
      score += 15;
    } else if (fii.netWorth > 500000000) {
      // > 500M
      score += 10;
    } else if (fii.netWorth > 200000000) {
      // > 200M
      score += 5;
    }

    // Segment bonus (0-15 points)
    if (['Logistics', 'Corporate'].includes(fii.segment)) {
      score += 15; // Preferred segments
    } else if (['Retail', 'Industrial'].includes(fii.segment)) {
      score += 10;
    } else {
      score += 5; // Other segments
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateRationale(fii: any, score: number): string[] {
    const rationale: string[] = [];

    if (fii.dividendYield12m > 8) {
      rationale.push(`DY 12m atrativo: ${fii.dividendYield12m.toFixed(1)}%`);
    }

    if (fii.pvp && fii.pvp < 1.0) {
      rationale.push(
        `Negociando abaixo do valor patrimonial (P/VP: ${fii.pvp.toFixed(2)})`,
      );
    }

    if (fii.volume24h > 1500000) {
      rationale.push('Boa liquidez para entrada/saída');
    }

    if (fii.netWorth > 800000000) {
      rationale.push('Fundo consolidado com bom patrimônio');
    }

    if (fii.segment === 'Logistics') {
      rationale.push('Setor logístico com crescimento estrutural');
    } else if (fii.segment === 'Corporate') {
      rationale.push('Exposição a imóveis corporativos');
    }

    if (score >= 80) {
      rationale.push('Combinação atrativa de yield e qualidade');
    }

    return rationale;
  }
}
