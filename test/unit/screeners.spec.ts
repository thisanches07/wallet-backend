import { Test, TestingModule } from '@nestjs/testing';
import { CryptoProvider } from '../../src/providers/crypto.provider';
import { EquitiesProvider } from '../../src/providers/equities.provider';
import { FundsProvider } from '../../src/providers/funds.provider';
import { MacroProvider } from '../../src/providers/macro.provider';
import { TesouroProvider } from '../../src/providers/tesouro.provider';
import { CryptoScreener } from '../../src/screeners/crypto.screener';
import { EquitiesScreener } from '../../src/screeners/equities.screener';
import { FiisScreener } from '../../src/screeners/fiis.screener';
import { IntlScreener } from '../../src/screeners/intl.screener';
import { TreasuryScreener } from '../../src/screeners/treasury.screener';

describe('Screeners', () => {
  let treasuryScreener: TreasuryScreener;
  let equitiesScreener: EquitiesScreener;
  let fiisScreener: FiisScreener;
  let intlScreener: IntlScreener;
  let cryptoScreener: CryptoScreener;

  const mockTesouroProvider = {
    getTreasuryBonds: jest.fn(),
  };

  const mockMacroProvider = {
    getMacroScenario: jest.fn(),
  };

  const mockEquitiesProvider = {
    getBrazilianEquities: jest.fn(),
  };

  const mockFundsProvider = {
    getRealEstateFunds: jest.fn(),
  };

  const mockCryptoProvider = {
    getCryptocurrencies: jest.fn(),
    getCryptoMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryScreener,
        EquitiesScreener,
        FiisScreener,
        IntlScreener,
        CryptoScreener,
        {
          provide: TesouroProvider,
          useValue: mockTesouroProvider,
        },
        {
          provide: MacroProvider,
          useValue: mockMacroProvider,
        },
        {
          provide: EquitiesProvider,
          useValue: mockEquitiesProvider,
        },
        {
          provide: FundsProvider,
          useValue: mockFundsProvider,
        },
        {
          provide: CryptoProvider,
          useValue: mockCryptoProvider,
        },
      ],
    }).compile();

    treasuryScreener = module.get<TreasuryScreener>(TreasuryScreener);
    equitiesScreener = module.get<EquitiesScreener>(EquitiesScreener);
    fiisScreener = module.get<FiisScreener>(FiisScreener);
    intlScreener = module.get<IntlScreener>(IntlScreener);
    cryptoScreener = module.get<CryptoScreener>(CryptoScreener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TreasuryScreener', () => {
    it('should score treasury bonds correctly', async () => {
      mockTesouroProvider.getTreasuryBonds.mockResolvedValue([
        {
          id: 'TESOURO-IPCA-2035',
          name: 'Tesouro IPCA+ 2035',
          maturity: '2035-05-15',
          indexType: 'IPCA',
          realYield: 6.5, // High yield
          duration: 9.1,
          minInvestment: 30,
        },
        {
          id: 'TESOURO-SELIC-2027',
          name: 'Tesouro Selic 2027',
          maturity: '2027-03-01',
          indexType: 'SELIC',
          nominalYield: 10.75,
          duration: 1.8, // Short duration
          minInvestment: 30,
        },
      ]);

      mockMacroProvider.getMacroScenario.mockResolvedValue({
        selic: 10.75,
        ipca: 4.2,
        usdBrl: 5.15,
        gdpGrowth: 2.1,
      });

      const result = await treasuryScreener.screenTreasuryBonds();

      expect(result).toHaveLength(2);
      expect(result[0].score).toBeGreaterThan(70); // High scoring bond should be first
      expect(result[0].rationale).toContain('Taxa real acima da média 90d');
      expect(result.every((item) => item.class === 'fixed_income')).toBe(true);
    });
  });

  describe('FiisScreener', () => {
    it('should score FIIs based on dividend yield and P/VP', async () => {
      mockFundsProvider.getRealEstateFunds.mockResolvedValue([
        {
          ticker: 'BCFF11',
          name: 'BTG Pactual Corporate Fund',
          segment: 'Corporate',
          price: 96.45,
          dividendYield12m: 10.5, // High yield
          pvp: 0.9, // Below book value
          volume24h: 2500000,
          netWorth: 850000000,
        },
        {
          ticker: 'TEST11',
          name: 'Test FII',
          segment: 'Retail',
          price: 100.0,
          dividendYield12m: 4.0, // Low yield
          pvp: 1.2, // Above book value
          volume24h: 500000,
          netWorth: 200000000,
        },
      ]);

      const result = await fiisScreener.screenRealEstateFunds();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('BCFF11'); // Should be first due to higher score
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[0].rationale).toContain('DY 12m atrativo');
    });
  });

  describe('IntlScreener', () => {
    it('should screen international ETFs', async () => {
      const result = await intlScreener.screenInternationalETFs();

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((item) => item.class === 'intl')).toBe(true);
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('rationale');
      expect(result[0].metrics).toHaveProperty('expense_ratio');
    });
  });

  describe('CryptoScreener', () => {
    it('should prioritize established cryptocurrencies', async () => {
      const mockCryptos = [
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 43250.0,
          marketCap: 850000000000,
          volume24h: 15000000000,
          priceChange24h: 2.5,
          priceHistory: [
            { date: '2024-01-01', price: 40000 },
            { date: '2024-02-01', price: 43250 },
          ],
        },
        {
          id: 'unknown-coin',
          symbol: 'UNK',
          name: 'Unknown Coin',
          price: 0.01,
          marketCap: 1000000, // Very small
          volume24h: 10000, // Low volume
          priceChange24h: -15.0, // High volatility
          priceHistory: [
            { date: '2024-01-01', price: 0.02 },
            { date: '2024-02-01', price: 0.01 },
          ],
        },
      ];

      mockCryptoProvider.getCryptocurrencies.mockResolvedValue(mockCryptos);
      mockCryptoProvider.getCryptoMetrics.mockImplementation((symbol) => {
        if (symbol === 'BTC') {
          return Promise.resolve({
            marketCap: 850000000000,
            volume24h: 15000000000,
            volatility: 65,
          });
        }
        return Promise.resolve({
          marketCap: 1000000,
          volume24h: 10000,
          volatility: 150,
        });
      });

      const result = await cryptoScreener.screenCryptocurrencies();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('bitcoin'); // Bitcoin should score higher
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[0].rationale).toContain('ouro digital');
    });
  });
});
