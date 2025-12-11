import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { ProvidersModule } from '../src/providers/providers.module';
import { RecommendationsModule } from '../src/recommendations/recommendations.module';
import { ScreenersModule } from '../src/screeners/screeners.module';

describe('RecommendationsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RecommendationsModule, ProvidersModule, ScreenersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/recommendations (GET)', () => {
    return request(app.getHttpServer())
      .get('/recommendations')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('items');
        expect(Array.isArray(res.body.items)).toBe(true);
        if (res.body.items.length > 0) {
          const item = res.body.items[0];
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('class');
          expect(item).toHaveProperty('score');
          expect(item).toHaveProperty('rationale');
          expect(item).toHaveProperty('metrics');
          expect(item).toHaveProperty('source');
          expect(item).toHaveProperty('updatedAt');
        }
      });
  });

  it('/recommendations?class=treasury (GET)', () => {
    return request(app.getHttpServer())
      .get('/recommendations?class=treasury')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('items');
        if (res.body.items.length > 0) {
          expect(
            res.body.items.every((item: any) => item.class === 'fixed_income'),
          ).toBe(true);
        }
      });
  });

  it('/recommendations?class=equity_br&risk=conservative (GET)', () => {
    return request(app.getHttpServer())
      .get('/recommendations?class=equity_br&risk=conservative')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('items');
        // Conservative risk should return limited results or none for equities
      });
  });

  it('/recommendations?horizon=short&limit=5 (GET)', () => {
    return request(app.getHttpServer())
      .get('/recommendations?horizon=short&limit=5')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('items');
        expect(res.body.items.length).toBeLessThanOrEqual(5);
      });
  });

  it('/recommendations with invalid class (GET)', () => {
    return request(app.getHttpServer())
      .get('/recommendations?class=invalid')
      .expect(400); // Should return validation error
  });
});
