import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceHistory } from '../common/utils/momentum.utils';
import { BaseDataProvider } from './base.provider';

export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceHistory: PriceHistory[];
}

@Injectable()
export class CryptoProvider extends BaseDataProvider {
  constructor(private configService: ConfigService) {
    super();
  }

  getName(): string {
    return 'CoinGecko';
  }

  isAvailable(): boolean {
    // For free tier, no API key needed, but could check rate limits
    return true;
  }

  // TODO: Replace with real CoinGecko API
  async getCryptocurrencies(): Promise<Cryptocurrency[]> {
    try {
      // Stub data - replace with actual CoinGecko API call
      return [
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 43250.0,
          marketCap: 850000000000,
          volume24h: 15000000000,
          priceChange24h: 2.5,
          priceHistory: this.generateMockPriceHistory(43250.0),
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          price: 2680.0,
          marketCap: 320000000000,
          volume24h: 8000000000,
          priceChange24h: -1.2,
          priceHistory: this.generateMockPriceHistory(2680.0),
        },
        {
          id: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          price: 98.5,
          marketCap: 45000000000,
          volume24h: 1200000000,
          priceChange24h: 5.8,
          priceHistory: this.generateMockPriceHistory(98.5),
        },
      ];
    } catch (error) {
      return this.handleError(error, []);
    }
  }

  async getCryptoPrice(symbol: string): Promise<number> {
    try {
      const cryptos = await this.getCryptocurrencies();
      const crypto = cryptos.find(
        (c) => c.symbol.toLowerCase() === symbol.toLowerCase(),
      );
      return crypto?.price || 0;
    } catch (error) {
      return this.handleError(error, 0);
    }
  }

  async getCryptoMetrics(symbol: string): Promise<{
    marketCap: number;
    volume24h: number;
    volatility: number;
  }> {
    try {
      const cryptos = await this.getCryptocurrencies();
      const crypto = cryptos.find(
        (c) => c.symbol.toLowerCase() === symbol.toLowerCase(),
      );

      if (!crypto) {
        return { marketCap: 0, volume24h: 0, volatility: 0 };
      }

      // Calculate volatility from price history
      const volatility = this.calculateVolatility(crypto.priceHistory);

      return {
        marketCap: crypto.marketCap,
        volume24h: crypto.volume24h,
        volatility,
      };
    } catch (error) {
      return this.handleError(error, {
        marketCap: 0,
        volume24h: 0,
        volatility: 0,
      });
    }
  }

  private generateMockPriceHistory(currentPrice: number): PriceHistory[] {
    const history: PriceHistory[] = [];
    const days = 365;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Crypto has higher volatility
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% daily variation
      const price = currentPrice * randomFactor * (0.5 + Math.random() * 1.0); // ±50% range

      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
      });
    }

    return history;
  }

  private calculateVolatility(prices: PriceHistory[]): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const prevPrice = prices[i - 1].price;
      const currentPrice = prices[i].price;
      returns.push((currentPrice - prevPrice) / prevPrice);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility %
  }
}
