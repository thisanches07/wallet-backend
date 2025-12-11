import { Injectable } from '@nestjs/common';
import { MOMENTUM_PERIODS } from '../common/constants';
import { calculateMomentum } from '../common/utils/momentum.utils';
import { AssetClass } from '../positions/asset-class.enum';
import { CryptoProvider } from '../providers/crypto.provider';
import { RecommendationItem } from './score.types';

@Injectable()
export class CryptoScreener {
  constructor(private cryptoProvider: CryptoProvider) {}

  async screenCryptocurrencies(): Promise<RecommendationItem[]> {
    const cryptos = await this.cryptoProvider.getCryptocurrencies();
    const recommendations: RecommendationItem[] = [];

    for (const crypto of cryptos) {
      const score = this.calculateScore(crypto);
      const rationale = this.generateRationale(crypto, score);
      const metrics = await this.cryptoProvider.getCryptoMetrics(crypto.symbol);

      const momentum3m = calculateMomentum(
        crypto.priceHistory,
        MOMENTUM_PERIODS.SHORT,
      );
      const momentum6m = calculateMomentum(
        crypto.priceHistory,
        MOMENTUM_PERIODS.MID,
      );

      recommendations.push({
        id: crypto.id,
        name: crypto.name,
        class: AssetClass.CRYPTO,
        score,
        rationale,
        metrics: {
          symbol: crypto.symbol,
          price: crypto.price,
          market_cap: crypto.marketCap,
          volume_24h: crypto.volume24h,
          price_change_24h: crypto.priceChange24h,
          momentum_3m: Math.round(momentum3m * 100) / 100,
          momentum_6m: Math.round(momentum6m * 100) / 100,
          volatility: Math.round(metrics.volatility * 100) / 100,
        },
        source: 'CoinGecko',
        updatedAt: new Date().toISOString(),
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private calculateScore(crypto: any): number {
    let score = 50; // Base score

    // Market cap score (0-25 points) - prefer established coins
    if (crypto.marketCap > 500000000000) {
      // > 500B (BTC level)
      score += 25;
    } else if (crypto.marketCap > 100000000000) {
      // > 100B (ETH level)
      score += 20;
    } else if (crypto.marketCap > 20000000000) {
      // > 20B (top 10)
      score += 15;
    } else if (crypto.marketCap > 5000000000) {
      // > 5B (top 20)
      score += 10;
    }

    // Volume score (0-20 points)
    if (crypto.volume24h > 10000000000) {
      // > 10B
      score += 20;
    } else if (crypto.volume24h > 5000000000) {
      // > 5B
      score += 15;
    } else if (crypto.volume24h > 1000000000) {
      // > 1B
      score += 10;
    }

    // Recent performance score (0-25 points)
    const momentum3m = calculateMomentum(
      crypto.priceHistory,
      MOMENTUM_PERIODS.SHORT,
    );
    if (momentum3m > 20) {
      score += 25;
    } else if (momentum3m > 10) {
      score += 20;
    } else if (momentum3m > 0) {
      score += 15;
    } else if (momentum3m > -10) {
      score += 10;
    }

    // Established crypto bonus (0-20 points)
    if (crypto.symbol === 'BTC') {
      score += 20; // Store of value
    } else if (crypto.symbol === 'ETH') {
      score += 18; // Smart contracts platform
    } else if (['ADA', 'SOL', 'DOT'].includes(crypto.symbol)) {
      score += 15; // Major altcoins
    } else {
      score += 5; // Other cryptos
    }

    // Volatility penalty (0 to -10 points)
    // Note: This is a simplified calculation, in reality we'd calculate proper volatility
    if (Math.abs(crypto.priceChange24h) > 10) {
      score -= 10; // High recent volatility
    } else if (Math.abs(crypto.priceChange24h) > 5) {
      score -= 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateRationale(crypto: any, score: number): string[] {
    const rationale: string[] = [];

    if (crypto.marketCap > 200000000000) {
      rationale.push('Cripto estabelecida com alta capitalização');
    }

    if (crypto.volume24h > 5000000000) {
      rationale.push('Alta liquidez global');
    }

    const momentum3m = calculateMomentum(
      crypto.priceHistory,
      MOMENTUM_PERIODS.SHORT,
    );
    if (momentum3m > 10) {
      rationale.push('Momentum positivo recente');
    } else if (momentum3m > 0) {
      rationale.push('Tendência de recuperação');
    }

    if (crypto.symbol === 'BTC') {
      rationale.push('Reserve of value digital, "ouro digital"');
    } else if (crypto.symbol === 'ETH') {
      rationale.push('Plataforma líder para contratos inteligentes');
    } else if (crypto.symbol === 'SOL') {
      rationale.push('Blockchain de alta performance');
    }

    if (Math.abs(crypto.priceChange24h) < 3) {
      rationale.push('Volatilidade controlada no curto prazo');
    }

    if (score >= 80) {
      rationale.push('Opção sólida para exposição cripto');
    } else if (score < 60) {
      rationale.push('Risco elevado - adequado apenas para perfil agressivo');
    }

    return rationale;
  }
}
