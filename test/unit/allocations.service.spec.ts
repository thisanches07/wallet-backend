import { Test, TestingModule } from '@nestjs/testing';
import { AllocationsService } from '../../src/allocations/allocations.service';
import { AssetClass } from '../../src/positions/asset-class.enum';
import { PositionsService } from '../../src/positions/positions.service';

describe('AllocationsService', () => {
  let service: AllocationsService;
  let positionsService: PositionsService;

  const mockPositionsService = {
    getClassifiedPositions: jest.fn(),
    getTotalPortfolioValue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllocationsService,
        {
          provide: PositionsService,
          useValue: mockPositionsService,
        },
      ],
    }).compile();

    service = module.get<AllocationsService>(AllocationsService);
    positionsService = module.get<PositionsService>(PositionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentAllocation', () => {
    it('should calculate allocation percentages correctly', async () => {
      const mockPositions = [
        {
          class: AssetClass.FIXED_INCOME,
          totalValue: 3800,
          holdings: [],
        },
        {
          class: AssetClass.EQUITIES_BR,
          totalValue: 1800,
          holdings: [],
        },
        {
          class: AssetClass.INTL,
          totalValue: 1800,
          holdings: [],
        },
        {
          class: AssetClass.FIIS,
          totalValue: 1300,
          holdings: [],
        },
        {
          class: AssetClass.CRYPTO,
          totalValue: 800,
          holdings: [],
        },
        {
          class: AssetClass.CASH,
          totalValue: 500,
          holdings: [],
        },
      ];

      mockPositionsService.getClassifiedPositions.mockResolvedValue(
        mockPositions,
      );

      const result = await service.getCurrentAllocation('user-123');

      expect(result[AssetClass.FIXED_INCOME]).toBeCloseTo(38);
      expect(result[AssetClass.EQUITIES_BR]).toBeCloseTo(18);
      expect(result[AssetClass.INTL]).toBeCloseTo(18);
      expect(result[AssetClass.FIIS]).toBeCloseTo(13);
      expect(result[AssetClass.CRYPTO]).toBeCloseTo(8);
      expect(result[AssetClass.CASH]).toBeCloseTo(5);
    });
  });

  describe('getAllocationGaps', () => {
    it('should calculate gaps correctly', async () => {
      mockPositionsService.getClassifiedPositions.mockResolvedValue([
        {
          class: AssetClass.FIXED_INCOME,
          totalValue: 4500, // 45%
          holdings: [],
        },
        {
          class: AssetClass.EQUITIES_BR,
          totalValue: 1500, // 15%
          holdings: [],
        },
        {
          class: AssetClass.INTL,
          totalValue: 2000, // 20%
          holdings: [],
        },
        {
          class: AssetClass.FIIS,
          totalValue: 1000, // 10%
          holdings: [],
        },
        {
          class: AssetClass.CRYPTO,
          totalValue: 500, // 5%
          holdings: [],
        },
        {
          class: AssetClass.CASH,
          totalValue: 500, // 5%
          holdings: [],
        },
      ]);

      const gaps = await service.getAllocationGaps('user-123');

      expect(gaps[AssetClass.FIXED_INCOME]).toBeCloseTo(-7); // 38 - 45
      expect(gaps[AssetClass.EQUITIES_BR]).toBeCloseTo(3); // 18 - 15
      expect(gaps[AssetClass.INTL]).toBeCloseTo(-2); // 18 - 20
      expect(gaps[AssetClass.FIIS]).toBeCloseTo(3); // 13 - 10
      expect(gaps[AssetClass.CRYPTO]).toBeCloseTo(3); // 8 - 5
      expect(gaps[AssetClass.CASH]).toBeCloseTo(0); // 5 - 5
    });
  });

  describe('getRebalanceBands', () => {
    it('should identify actionable classes correctly', async () => {
      mockPositionsService.getClassifiedPositions.mockResolvedValue([
        {
          class: AssetClass.FIXED_INCOME,
          totalValue: 4500, // 45% (gap: -7%)
          holdings: [],
        },
        {
          class: AssetClass.EQUITIES_BR,
          totalValue: 1500, // 15% (gap: +3%)
          holdings: [],
        },
        {
          class: AssetClass.INTL,
          totalValue: 1800, // 18% (gap: 0%)
          holdings: [],
        },
        {
          class: AssetClass.FIIS,
          totalValue: 1000, // 10% (gap: +3%)
          holdings: [],
        },
        {
          class: AssetClass.CRYPTO,
          totalValue: 200, // 2% (gap: +6%)
          holdings: [],
        },
        {
          class: AssetClass.CASH,
          totalValue: 1000, // 10% (gap: -5%)
          holdings: [],
        },
      ]);

      const bands = await service.getRebalanceBands('user-123');

      expect(bands.min_band_pct).toBe(2.5);
      expect(bands.actionable).toContain(AssetClass.FIXED_INCOME); // -7%
      expect(bands.actionable).toContain(AssetClass.CRYPTO); // +6%
      expect(bands.actionable).toContain(AssetClass.CASH); // -5%
      expect(bands.actionable).not.toContain(AssetClass.INTL); // 0%
      expect(bands.actionable).not.toContain(AssetClass.EQUITIES_BR); // +3%
    });
  });
});
