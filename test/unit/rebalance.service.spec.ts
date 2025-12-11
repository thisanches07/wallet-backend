import { Test, TestingModule } from '@nestjs/testing';
import { AllocationsService } from '../../src/allocations/allocations.service';
import { RebalanceService } from '../../src/portfolio/rebalance.service';
import { AssetClass } from '../../src/positions/asset-class.enum';
import { PositionsService } from '../../src/positions/positions.service';

describe('RebalanceService', () => {
  let service: RebalanceService;
  let positionsService: PositionsService;
  let allocationsService: AllocationsService;

  const mockPositionsService = {
    getClassifiedPositions: jest.fn(),
    getTotalPortfolioValue: jest.fn(),
  };

  const mockAllocationsService = {
    getCurrentAllocation: jest.fn(),
    getTargetAllocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RebalanceService,
        {
          provide: PositionsService,
          useValue: mockPositionsService,
        },
        {
          provide: AllocationsService,
          useValue: mockAllocationsService,
        },
      ],
    }).compile();

    service = module.get<RebalanceService>(RebalanceService);
    positionsService = module.get<PositionsService>(PositionsService);
    allocationsService = module.get<AllocationsService>(AllocationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRebalancePlan', () => {
    it('should generate buy-only plan when prefer_new_contributions is true', async () => {
      mockPositionsService.getClassifiedPositions.mockResolvedValue([
        {
          class: AssetClass.FIXED_INCOME,
          totalValue: 8000, // 80%
          holdings: [],
        },
        {
          class: AssetClass.EQUITIES_BR,
          totalValue: 2000, // 20%
          holdings: [],
        },
        {
          class: AssetClass.INTL,
          totalValue: 0, // 0%
          holdings: [],
        },
        {
          class: AssetClass.FIIS,
          totalValue: 0, // 0%
          holdings: [],
        },
        {
          class: AssetClass.CRYPTO,
          totalValue: 0, // 0%
          holdings: [],
        },
        {
          class: AssetClass.CASH,
          totalValue: 0, // 0%
          holdings: [],
        },
      ]);

      mockAllocationsService.getCurrentAllocation.mockResolvedValue({
        [AssetClass.FIXED_INCOME]: 80,
        [AssetClass.EQUITIES_BR]: 20,
        [AssetClass.INTL]: 0,
        [AssetClass.FIIS]: 0,
        [AssetClass.CRYPTO]: 0,
        [AssetClass.CASH]: 0,
      });

      const result = await service.generateRebalancePlan('user-123', {
        constraints: {
          min_ticket: 100,
          max_monthly_new_cash: 2000,
        },
        preferences: {
          prefer_new_contributions: true,
          avoid_tax_events: true,
        },
      });

      expect(result.plan.sell).toHaveLength(0);
      expect(result.plan.buy.length).toBeGreaterThan(0);
      expect(result.notes).toContain(
        'Priorizar correção via novos aportes para evitar IR',
      );
    });

    it('should generate sell and buy plan when new contributions are insufficient', async () => {
      mockPositionsService.getClassifiedPositions.mockResolvedValue([
        {
          class: AssetClass.FIXED_INCOME,
          totalValue: 9000, // 90%
          holdings: [],
        },
        {
          class: AssetClass.EQUITIES_BR,
          totalValue: 1000, // 10%
          holdings: [],
        },
        {
          class: AssetClass.INTL,
          totalValue: 0, // 0%
          holdings: [],
        },
        {
          class: AssetClass.FIIS,
          totalValue: 0, // 0%
          holdings: [],
        },
        {
          class: AssetClass.CRYPTO,
          totalValue: 0, // 0%
          holdings: [],
        },
        {
          class: AssetClass.CASH,
          totalValue: 0, // 0%
          holdings: [],
        },
      ]);

      mockAllocationsService.getCurrentAllocation.mockResolvedValue({
        [AssetClass.FIXED_INCOME]: 90,
        [AssetClass.EQUITIES_BR]: 10,
        [AssetClass.INTL]: 0,
        [AssetClass.FIIS]: 0,
        [AssetClass.CRYPTO]: 0,
        [AssetClass.CASH]: 0,
      });

      const result = await service.generateRebalancePlan('user-123', {
        constraints: {
          min_ticket: 100,
          max_monthly_new_cash: 500, // Low monthly limit
        },
        preferences: {
          prefer_new_contributions: true,
          avoid_tax_events: true,
        },
      });

      expect(result.plan.sell.length).toBeGreaterThan(0);
      expect(result.plan.buy.length).toBeGreaterThan(0);
    });

    it('should respect minimum ticket constraints', async () => {
      mockPositionsService.getClassifiedPositions.mockResolvedValue([
        {
          class: AssetClass.FIXED_INCOME,
          totalValue: 9950, // ~99.5%
          holdings: [],
        },
        {
          class: AssetClass.EQUITIES_BR,
          totalValue: 50, // ~0.5%
          holdings: [],
        },
        {
          class: AssetClass.INTL,
          totalValue: 0,
          holdings: [],
        },
        {
          class: AssetClass.FIIS,
          totalValue: 0,
          holdings: [],
        },
        {
          class: AssetClass.CRYPTO,
          totalValue: 0,
          holdings: [],
        },
        {
          class: AssetClass.CASH,
          totalValue: 0,
          holdings: [],
        },
      ]);

      mockAllocationsService.getCurrentAllocation.mockResolvedValue({
        [AssetClass.FIXED_INCOME]: 99.5,
        [AssetClass.EQUITIES_BR]: 0.5,
        [AssetClass.INTL]: 0,
        [AssetClass.FIIS]: 0,
        [AssetClass.CRYPTO]: 0,
        [AssetClass.CASH]: 0,
      });

      const result = await service.generateRebalancePlan('user-123', {
        constraints: {
          min_ticket: 500, // High minimum ticket
          max_monthly_new_cash: 2000,
        },
      });

      // Small adjustments below min_ticket should not appear in plan
      const smallActions = result.plan.buy.filter(
        (action) => action.amount < 500,
      );
      expect(smallActions).toHaveLength(0);
    });
  });
});
