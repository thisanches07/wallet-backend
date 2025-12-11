import { Injectable } from '@nestjs/common';
import {
  calculateAllocation,
  calculateGaps,
  getActionableClasses,
} from '../common/utils/allocation.utils';
import { AssetClass } from '../positions/asset-class.enum';
import { PositionsService } from '../positions/positions.service';
import {
  REBALANCE_BAND_THRESHOLD,
  TARGET_ALLOCATION,
} from './target-allocation.constant';

@Injectable()
export class AllocationsService {
  constructor(private positionsService: PositionsService) {}

  async getCurrentAllocation(
    userId: string,
  ): Promise<Record<AssetClass, number>> {
    const positions =
      await this.positionsService.getClassifiedPositions(userId);
    return calculateAllocation(positions);
  }

  getTargetAllocation(): Record<AssetClass, number> {
    return { ...TARGET_ALLOCATION };
  }

  async getAllocationGaps(userId: string): Promise<Record<AssetClass, number>> {
    const current = await this.getCurrentAllocation(userId);
    const target = this.getTargetAllocation();
    return calculateGaps(current, target);
  }

  async getRebalanceBands(userId: string): Promise<{
    min_band_pct: number;
    actionable: AssetClass[];
  }> {
    const gaps = await this.getAllocationGaps(userId);
    const actionable = getActionableClasses(gaps, REBALANCE_BAND_THRESHOLD);

    return {
      min_band_pct: REBALANCE_BAND_THRESHOLD,
      actionable,
    };
  }

  async getAnalysisNotes(userId: string): Promise<string[]> {
    const notes: string[] = [];
    const gaps = await this.getAllocationGaps(userId);
    const bands = await this.getRebalanceBands(userId);

    if (bands.actionable.length === 0) {
      notes.push('Portfolio está dentro das bandas de rebalanceamento');
    } else {
      notes.push(
        `${bands.actionable.length} classe(s) de ativo fora das bandas`,
      );
    }

    // Add specific notes for large gaps
    Object.entries(gaps).forEach(([cls, gap]) => {
      if (Math.abs(gap) >= REBALANCE_BAND_THRESHOLD * 2) {
        const direction = gap > 0 ? 'subexposta' : 'sobreexposta';
        notes.push(`${cls}: ${direction} em ${Math.abs(gap).toFixed(1)}p.p.`);
      }
    });

    const totalValue =
      await this.positionsService.getTotalPortfolioValue(userId);
    if (totalValue < 10000) {
      notes.push('Portfolio pequeno: foque em classes principais primeiro');
    }

    return notes;
  }
}
