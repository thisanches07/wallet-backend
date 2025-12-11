import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AllocationsModule } from '../src/allocations/allocations.module';
import { PortfolioModule } from '../src/portfolio/portfolio.module';
import { PositionsModule } from '../src/positions/positions.module';
import { ProvidersModule } from '../src/providers/providers.module';

describe('PortfolioController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PortfolioModule,
        AllocationsModule,
        PositionsModule,
        ProvidersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // Note: These tests will require authentication headers in real implementation
  describe('/portfolio/analysis (GET)', () => {
    it('should return portfolio analysis', () => {
      return request(app.getHttpServer())
        .get('/portfolio/analysis')
        .set('Authorization', 'Bearer mock-token') // Mock auth for testing
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('asOf');
          expect(res.body).toHaveProperty('current_allocation');
          expect(res.body).toHaveProperty('target_allocation');
          expect(res.body).toHaveProperty('gaps');
          expect(res.body).toHaveProperty('rebalance_bands');
          expect(res.body).toHaveProperty('notes');

          // Check allocation structure
          const allocation = res.body.current_allocation;
          expect(allocation).toHaveProperty('fixed_income');
          expect(allocation).toHaveProperty('equities_br');
          expect(allocation).toHaveProperty('intl');
          expect(allocation).toHaveProperty('fiis');
          expect(allocation).toHaveProperty('crypto');
          expect(allocation).toHaveProperty('cash');

          // Check rebalance bands
          expect(res.body.rebalance_bands).toHaveProperty('min_band_pct');
          expect(res.body.rebalance_bands).toHaveProperty('actionable');
          expect(Array.isArray(res.body.rebalance_bands.actionable)).toBe(true);

          // Check notes
          expect(Array.isArray(res.body.notes)).toBe(true);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/portfolio/analysis')
        .expect(401); // Unauthorized without token
    });
  });

  describe('/portfolio/rebalance/preview (POST)', () => {
    it('should return rebalance plan with default settings', () => {
      return request(app.getHttpServer())
        .post('/portfolio/rebalance/preview')
        .set('Authorization', 'Bearer mock-token')
        .send({})
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('plan');
          expect(res.body).toHaveProperty('timeline');
          expect(res.body).toHaveProperty('notes');

          // Check plan structure
          expect(res.body.plan).toHaveProperty('sell');
          expect(res.body.plan).toHaveProperty('buy');
          expect(Array.isArray(res.body.plan.sell)).toBe(true);
          expect(Array.isArray(res.body.plan.buy)).toBe(true);

          // Check timeline and notes
          expect(Array.isArray(res.body.timeline)).toBe(true);
          expect(Array.isArray(res.body.notes)).toBe(true);
        });
    });

    it('should accept custom target allocation', () => {
      const customRequest = {
        target_allocation: {
          fixed_income: 50,
          equities_br: 20,
          intl: 15,
          fiis: 10,
          crypto: 3,
          cash: 2,
        },
        constraints: {
          min_ticket: 200,
          max_monthly_new_cash: 2000,
        },
        preferences: {
          avoid_tax_events: false,
          prefer_new_contributions: false,
        },
      };

      return request(app.getHttpServer())
        .post('/portfolio/rebalance/preview')
        .set('Authorization', 'Bearer mock-token')
        .send(customRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('plan');
          expect(res.body).toHaveProperty('timeline');
          expect(res.body).toHaveProperty('notes');
        });
    });

    it('should reject invalid request body', () => {
      const invalidRequest = {
        target_allocation: {
          fixed_income: 'invalid', // Should be number
        },
      };

      return request(app.getHttpServer())
        .post('/portfolio/rebalance/preview')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidRequest)
        .expect(400); // Bad request due to validation error
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/portfolio/rebalance/preview')
        .send({})
        .expect(401); // Unauthorized without token
    });
  });
});
