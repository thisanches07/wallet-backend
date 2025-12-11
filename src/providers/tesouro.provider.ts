import { Injectable } from '@nestjs/common';
import { BaseDataProvider } from './base.provider';

export interface TreasuryBond {
  id: string;
  name: string;
  maturity: string;
  indexType: 'IPCA' | 'SELIC' | 'PREFIXADO';
  realYield?: number;
  nominalYield?: number;
  duration: number;
  minInvestment: number;
}

@Injectable()
export class TesouroProvider extends BaseDataProvider {
  getName(): string {
    return 'Tesouro Direto';
  }

  // TODO: Replace with real Tesouro Direto API
  async getTreasuryBonds(): Promise<TreasuryBond[]> {
    try {
      // Stub data - replace with actual API call
      return [
        {
          id: 'TESOURO-IPCA-2035',
          name: 'Tesouro IPCA+ 2035',
          maturity: '2035-05-15',
          indexType: 'IPCA',
          realYield: 5.7,
          duration: 9.1,
          minInvestment: 30,
        },
        {
          id: 'TESOURO-IPCA-2029',
          name: 'Tesouro IPCA+ 2029',
          maturity: '2029-05-15',
          indexType: 'IPCA',
          realYield: 5.5,
          duration: 4.2,
          minInvestment: 30,
        },
        {
          id: 'TESOURO-SELIC-2027',
          name: 'Tesouro Selic 2027',
          maturity: '2027-03-01',
          indexType: 'SELIC',
          nominalYield: 10.75,
          duration: 1.8,
          minInvestment: 30,
        },
        {
          id: 'TESOURO-PREFIXADO-2031',
          name: 'Tesouro Prefixado 2031',
          maturity: '2031-01-01',
          indexType: 'PREFIXADO',
          nominalYield: 11.2,
          duration: 5.5,
          minInvestment: 30,
        },
      ];
    } catch (error) {
      return this.handleError(error, []);
    }
  }

  async getCurrentRates(): Promise<{ selic: number; ipca: number }> {
    try {
      // Stub data - replace with BCB API
      return {
        selic: 10.75,
        ipca: 4.2,
      };
    } catch (error) {
      return this.handleError(error, { selic: 10.75, ipca: 4.2 });
    }
  }
}
