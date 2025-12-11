import { Injectable } from '@nestjs/common';
import { AssetClass } from '../positions/asset-class.enum';
import { MacroProvider } from '../providers/macro.provider';
import { TesouroProvider } from '../providers/tesouro.provider';
import { RecommendationItem } from './score.types';

@Injectable()
export class TreasuryScreener {
  constructor(
    private tesouroProvider: TesouroProvider,
    private macroProvider: MacroProvider,
  ) {}

  async screenTreasuryBonds(): Promise<RecommendationItem[]> {
    const bonds = await this.tesouroProvider.getTreasuryBonds();
    const rates = await this.macroProvider.getMacroScenario();

    const recommendations: RecommendationItem[] = [];

    for (const bond of bonds) {
      const score = this.calculateScore(bond, rates);
      const rationale = this.generateRationale(bond, rates, score);

      recommendations.push({
        id: bond.id,
        name: bond.name,
        class: AssetClass.FIXED_INCOME,
        score,
        rationale,
        metrics: {
          real_yield: bond.realYield || null,
          nominal_yield: bond.nominalYield || null,
          duration_y: bond.duration,
          liquidity: 'daily',
          min_investment: bond.minInvestment,
          index_type: bond.indexType,
        },
        source: 'Tesouro/BCB',
        updatedAt: new Date().toISOString(),
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private calculateScore(bond: any, rates: any): number {
    let score = 50; // Base score

    // Real yield score (0-30 points)
    if (bond.realYield) {
      if (bond.realYield > 6.0) score += 30;
      else if (bond.realYield > 5.0) score += 20;
      else if (bond.realYield > 4.0) score += 10;
    }

    // Duration score (0-20 points) - prefer moderate duration
    if (bond.duration >= 3 && bond.duration <= 10) {
      score += 20;
    } else if (bond.duration >= 1 && bond.duration <= 15) {
      score += 10;
    }

    // Index type score (0-20 points)
    if (bond.indexType === 'IPCA' && rates.ipca < 5) {
      score += 20; // IPCA bonds good in low inflation
    } else if (bond.indexType === 'SELIC') {
      score += 15; // Selic bonds for flexibility
    } else if (bond.indexType === 'PREFIXADO' && rates.selic > 10) {
      score += 10; // Prefixed when rates are high
    }

    // Liquidity bonus (0-10 points)
    score += 10; // All treasury bonds have daily liquidity

    return Math.min(100, Math.max(0, score));
  }

  private generateRationale(bond: any, rates: any, score: number): string[] {
    const rationale: string[] = [];

    if (bond.realYield && bond.realYield > 5.5) {
      rationale.push('Taxa real acima da média 90d');
    }

    if (bond.duration >= 3 && bond.duration <= 10) {
      rationale.push('Duration aderente ao horizonte');
    }

    if (bond.indexType === 'IPCA' && rates.ipca < 5) {
      rationale.push('Proteção inflacionária em cenário favorável');
    }

    if (bond.indexType === 'SELIC') {
      rationale.push('Flexibilidade para mudanças na Selic');
    }

    rationale.push('Liquidez diária garantida');

    if (score >= 80) {
      rationale.push('Oportunidade atrativa no momento');
    }

    return rationale;
  }
}
