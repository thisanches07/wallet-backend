import { Injectable } from '@nestjs/common';
import { AssetClass } from './asset-class.enum';
import { ClassifiedPosition, Holding } from './types';

@Injectable()
export class PositionsService {
  // TODO: Replace with real data from Pluggy or other sources
  async getUserHoldings(userId: string): Promise<Holding[]> {
    // Stub data - simulate user holdings
    return [
      {
        userId,
        assetId: 'TESOURO-IPCA-2035',
        class: AssetClass.FIXED_INCOME,
        qty: 1000,
        lastPrice: 3200.5,
      },
      {
        userId,
        assetId: 'PETR4',
        class: AssetClass.EQUITIES_BR,
        qty: 200,
        lastPrice: 32.45,
      },
      {
        userId,
        assetId: 'IVVB11',
        class: AssetClass.INTL,
        qty: 150,
        lastPrice: 250.8,
      },
      {
        userId,
        assetId: 'BCFF11',
        class: AssetClass.FIIS,
        qty: 100,
        lastPrice: 96.45,
      },
      {
        userId,
        assetId: 'BITCOIN',
        class: AssetClass.CRYPTO,
        qty: 0.1,
        lastPrice: 43250.0,
      },
      {
        userId,
        assetId: 'CASH-BRL',
        class: AssetClass.CASH,
        qty: 1,
        lastPrice: 2500.0,
      },
    ];
  }

  async getClassifiedPositions(userId: string): Promise<ClassifiedPosition[]> {
    const holdings = await this.getUserHoldings(userId);
    const positionMap = new Map<AssetClass, ClassifiedPosition>();

    // Initialize all asset classes
    Object.values(AssetClass).forEach((cls) => {
      positionMap.set(cls, {
        class: cls,
        totalValue: 0,
        holdings: [],
      });
    });

    // Group holdings by asset class
    holdings.forEach((holding) => {
      const position = positionMap.get(holding.class);
      if (position) {
        position.holdings.push(holding);
        position.totalValue += holding.qty * holding.lastPrice;
      }
    });

    return Array.from(positionMap.values());
  }

  async getTotalPortfolioValue(userId: string): Promise<number> {
    const positions = await this.getClassifiedPositions(userId);
    return positions.reduce((total, pos) => total + pos.totalValue, 0);
  }
}
