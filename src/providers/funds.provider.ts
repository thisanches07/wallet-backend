import { Injectable } from '@nestjs/common';
import { BaseDataProvider } from './base.provider';

export interface RealEstateFund {
  ticker: string;
  name: string;
  segment: string;
  price: number;
  dividendYield12m: number;
  pvp?: number;
  volume24h: number;
  netWorth: number;
}

export interface MutualFund {
  cnpj: string;
  name: string;
  category: string;
  aum: number;
  performance12m: number;
  managementFee: number;
  minInvestment: number;
}

@Injectable()
export class FundsProvider extends BaseDataProvider {
  getName(): string {
    return 'Funds & FIIs';
  }

  // TODO: Replace with real CVM/B3 API for FIIs and funds data
  async getRealEstateFunds(): Promise<RealEstateFund[]> {
    try {
      // Stub data - replace with actual API call
      return [
        {
          ticker: 'BCFF11',
          name: 'BTG Pactual Corporate Fund',
          segment: 'Corporate',
          price: 96.45,
          dividendYield12m: 9.2,
          pvp: 0.95,
          volume24h: 2500000,
          netWorth: 850000000,
        },
        {
          ticker: 'HGLG11',
          name: 'CSHG Logística',
          segment: 'Logistics',
          price: 132.8,
          dividendYield12m: 7.8,
          pvp: 1.05,
          volume24h: 1800000,
          netWorth: 1200000000,
        },
        {
          ticker: 'XPLG11',
          name: 'XP Log',
          segment: 'Logistics',
          price: 95.2,
          dividendYield12m: 8.5,
          pvp: 0.98,
          volume24h: 1200000,
          netWorth: 950000000,
        },
      ];
    } catch (error) {
      return this.handleError(error, []);
    }
  }

  async getMutualFunds(): Promise<MutualFund[]> {
    try {
      // Stub data - replace with CVM API
      return [
        {
          cnpj: '26.324.298/0001-89',
          name: 'XP Allocation Long Term FIC FIM',
          category: 'Allocation',
          aum: 2500000000,
          performance12m: 12.5,
          managementFee: 1.5,
          minInvestment: 1000,
        },
        {
          cnpj: '11.086.241/0001-31',
          name: 'Verde Asset Management FIC FIM',
          category: 'Equity',
          aum: 1800000000,
          performance12m: 18.2,
          managementFee: 2.0,
          minInvestment: 5000,
        },
      ];
    } catch (error) {
      return this.handleError(error, []);
    }
  }

  async getFundsByCategory(category: string): Promise<MutualFund[]> {
    try {
      const allFunds = await this.getMutualFunds();
      return allFunds.filter((fund) =>
        fund.category.toLowerCase().includes(category.toLowerCase()),
      );
    } catch (error) {
      return this.handleError(error, []);
    }
  }
}
