import { Injectable } from '@nestjs/common';
import { PriceHistory } from '../common/utils/momentum.utils';
import { BaseDataProvider } from './base.provider';

export interface BrazilianEquity {
  ticker: string;
  name: string;
  sector: string;
  marketCap: number;
  price: number;
  volume24h: number;
  priceHistory: PriceHistory[];
}

@Injectable()
export class EquitiesProvider extends BaseDataProvider {
  getName(): string {
    return 'Brazilian Equities';
  }

  isAvailable(): boolean {
    // TODO: Check if ALPHAVANTAGE_API_KEY is available
    return true;
  }

  // TODO: Replace with real Alpha Vantage or B3 API
  async getBrazilianEquities(): Promise<BrazilianEquity[]> {
    try {
      // Stub data - replace with actual API call
      return [
        {
          ticker: 'PETR4',
          name: 'Petrobras PN',
          sector: 'Energy',
          marketCap: 400000000000,
          price: 32.45,
          volume24h: 250000000,
          priceHistory: this.generateMockPriceHistory(32.45),
        },
        {
          ticker: 'VALE3',
          name: 'Vale ON',
          sector: 'Materials',
          marketCap: 350000000000,
          price: 68.22,
          volume24h: 180000000,
          priceHistory: this.generateMockPriceHistory(68.22),
        },
        {
          ticker: 'ITUB4',
          name: 'Itaú Unibanco PN',
          sector: 'Financials',
          marketCap: 300000000000,
          price: 33.15,
          volume24h: 120000000,
          priceHistory: this.generateMockPriceHistory(33.15),
        },
        {
          ticker: 'BBDC4',
          name: 'Bradesco PN',
          sector: 'Financials',
          marketCap: 200000000000,
          price: 14.85,
          volume24h: 90000000,
          priceHistory: this.generateMockPriceHistory(14.85),
        },
      ];
    } catch (error) {
      return this.handleError(error, []);
    }
  }

  async getEquityPrice(ticker: string): Promise<number> {
    try {
      const equities = await this.getBrazilianEquities();
      const equity = equities.find((e) => e.ticker === ticker);
      return equity?.price || 0;
    } catch (error) {
      return this.handleError(error, 0);
    }
  }

  private generateMockPriceHistory(currentPrice: number): PriceHistory[] {
    const history: PriceHistory[] = [];
    const days = 365;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic price movements
      const randomFactor = 0.95 + Math.random() * 0.1; // ±5% daily variation
      const price = currentPrice * randomFactor * (0.8 + Math.random() * 0.4); // Overall ±20% range

      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
      });
    }

    return history;
  }
}
