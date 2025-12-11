import { Injectable } from '@nestjs/common';
import { AllocationsService } from '../allocations/allocations.service';
import { TARGET_ALLOCATION } from '../allocations/target-allocation.constant';
import { API_CONSTANTS } from '../common/constants';
import { AssetClass } from '../positions/asset-class.enum';
import { PositionsService } from '../positions/positions.service';
import {
  ConstraintsDto,
  PreferencesDto,
  RebalanceRequestDto,
  TargetAllocationDto,
} from './dtos/rebalance.request.dto';
import {
  RebalancePlanDto,
  RebalanceResponseDto,
} from './dtos/rebalance.response.dto';

@Injectable()
export class RebalanceService {
  constructor(
    private positionsService: PositionsService,
    private allocationsService: AllocationsService,
  ) {}

  async generateRebalancePlan(
    userId: string,
    request: RebalanceRequestDto,
  ): Promise<RebalanceResponseDto> {
    const targetAllocation = this.getEffectiveTargetAllocation(
      request.target_allocation,
    );
    const constraints = this.getEffectiveConstraints(request.constraints);
    const preferences = this.getEffectivePreferences(request.preferences);

    const currentPositions =
      await this.positionsService.getClassifiedPositions(userId);
    const totalValue = currentPositions.reduce(
      (sum, pos) => sum + pos.totalValue,
      0,
    );

    const currentAllocation =
      await this.allocationsService.getCurrentAllocation(userId);
    const gaps = this.calculateGaps(currentAllocation, targetAllocation);

    const plan = await this.buildRebalancePlan(
      gaps,
      totalValue,
      currentPositions,
      constraints,
      preferences,
    );

    const timeline = this.generateTimeline(plan, constraints);
    const notes = this.generateNotes(plan, preferences, totalValue);

    return {
      plan,
      timeline,
      notes,
    };
  }

  private getEffectiveTargetAllocation(
    target?: TargetAllocationDto,
  ): Record<AssetClass, number> {
    const effective = { ...TARGET_ALLOCATION };

    if (target) {
      Object.entries(target).forEach(([key, value]) => {
        if (value !== undefined) {
          effective[key as AssetClass] = value;
        }
      });
    }

    return effective;
  }

  private getEffectiveConstraints(
    constraints?: ConstraintsDto,
  ): Required<ConstraintsDto> {
    return {
      min_ticket: constraints?.min_ticket ?? API_CONSTANTS.MIN_TICKET_VALUE,
      max_monthly_new_cash:
        constraints?.max_monthly_new_cash ?? API_CONSTANTS.MAX_MONTHLY_NEW_CASH,
    };
  }

  private getEffectivePreferences(
    preferences?: PreferencesDto,
  ): Required<PreferencesDto> {
    return {
      avoid_tax_events: preferences?.avoid_tax_events ?? true,
      prefer_new_contributions: preferences?.prefer_new_contributions ?? true,
    };
  }

  private calculateGaps(
    current: Record<AssetClass, number>,
    target: Record<AssetClass, number>,
  ): Record<AssetClass, number> {
    const gaps: Record<AssetClass, number> = {} as Record<AssetClass, number>;

    Object.values(AssetClass).forEach((cls) => {
      gaps[cls] = target[cls] - current[cls];
    });

    return gaps;
  }

  private async buildRebalancePlan(
    gaps: Record<AssetClass, number>,
    totalValue: number,
    currentPositions: any[],
    constraints: Required<ConstraintsDto>,
    preferences: Required<PreferencesDto>,
  ): Promise<RebalancePlanDto> {
    const plan: RebalancePlanDto = {
      sell: [],
      buy: [],
    };

    // Calculate absolute values needed
    const gapAmounts: Record<AssetClass, number> = {} as Record<
      AssetClass,
      number
    >;
    Object.entries(gaps).forEach(([cls, gapPct]) => {
      gapAmounts[cls as AssetClass] = (gapPct / 100) * totalValue;
    });

    // If prefer new contributions, try to solve with buying only
    if (preferences.prefer_new_contributions) {
      const totalBuyNeeded = Object.values(gapAmounts)
        .filter((amount) => amount > 0)
        .reduce((sum, amount) => sum + amount, 0);

      if (totalBuyNeeded <= constraints.max_monthly_new_cash) {
        // Can solve with new money only
        Object.entries(gapAmounts).forEach(([cls, amount]) => {
          if (amount > constraints.min_ticket) {
            plan.buy.push({
              assetId: this.getRepresentativeAsset(cls as AssetClass),
              amount: Math.round(amount),
              reason: `abaixo do alvo ${cls}`,
            });
          }
        });
        return plan;
      }
    }

    // Need to sell and buy
    Object.entries(gapAmounts).forEach(([cls, amount]) => {
      if (amount < -constraints.min_ticket) {
        // Need to sell (overallocated)
        plan.sell.push({
          assetId: this.getRepresentativeAsset(cls as AssetClass),
          amount: Math.round(Math.abs(amount)),
          reason: `acima do alvo`,
        });
      } else if (amount > constraints.min_ticket) {
        // Need to buy (underallocated)
        plan.buy.push({
          assetId: this.getRepresentativeAsset(cls as AssetClass),
          amount: Math.round(amount),
          reason: `abaixo do alvo ${cls}`,
        });
      }
    });

    return plan;
  }

  private getRepresentativeAsset(assetClass: AssetClass): string {
    // Return representative assets for each class (in real implementation,
    // this could come from recommendations or user preferences)
    const representatives = {
      [AssetClass.FIXED_INCOME]: 'TESOURO-IPCA-2035',
      [AssetClass.EQUITIES_BR]: 'PETR4',
      [AssetClass.INTL]: 'IVVB11',
      [AssetClass.FIIS]: 'BCFF11',
      [AssetClass.CRYPTO]: 'BITCOIN',
      [AssetClass.CASH]: 'CASH-BRL',
    };

    return representatives[assetClass];
  }

  private generateTimeline(
    plan: RebalancePlanDto,
    constraints: Required<ConstraintsDto>,
  ): string[] {
    const timeline: string[] = [];

    if (plan.sell.length === 0 && plan.buy.length === 0) {
      timeline.push('Portfolio já está balanceado');
      return timeline;
    }

    const totalBuyAmount = plan.buy.reduce(
      (sum, action) => sum + action.amount,
      0,
    );

    if (plan.sell.length === 0) {
      // Only buying with new money
      const months = Math.ceil(
        totalBuyAmount / constraints.max_monthly_new_cash,
      );
      if (months === 1) {
        timeline.push('Mês 1: investir com novo aporte conforme plano');
      } else {
        timeline.push(`Execução em ${months} meses com aportes mensais`);
        for (let i = 1; i <= Math.min(months, 3); i++) {
          const monthlyAmount = Math.min(
            constraints.max_monthly_new_cash,
            totalBuyAmount - (i - 1) * constraints.max_monthly_new_cash,
          );
          timeline.push(
            `Mês ${i}: aportar R$ ${monthlyAmount.toLocaleString()}`,
          );
        }
      }
    } else {
      // Need to sell and buy
      timeline.push('Mês 1: executar vendas planejadas');
      timeline.push('Mês 1-2: reinvestir recursos + novo aporte');
    }

    return timeline;
  }

  private generateNotes(
    plan: RebalancePlanDto,
    preferences: Required<PreferencesDto>,
    totalValue: number,
  ): string[] {
    const notes: string[] = [];

    if (plan.sell.length === 0) {
      notes.push('Priorizar correção via novos aportes para evitar IR');
    } else if (preferences.avoid_tax_events) {
      notes.push('Vendas planejadas podem gerar eventos tributários');
    }

    if (totalValue < 50000) {
      notes.push(
        'Portfolio pequeno: considere focar nas classes principais primeiro',
      );
    }

    const totalRebalanceAmount =
      plan.buy.reduce((sum, action) => sum + action.amount, 0) +
      plan.sell.reduce((sum, action) => sum + action.amount, 0);

    if (totalRebalanceAmount > totalValue * 0.2) {
      notes.push('Rebalanceamento significativo: considere execução gradual');
    }

    if (plan.buy.length + plan.sell.length > 5) {
      notes.push('Muitas operações: considere consolidar em ETFs ou fundos');
    }

    return notes;
  }
}
