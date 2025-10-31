import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

describe('Users Endpoints (e2e)', () => {
  let app: INestApplication;
  const token = 'fake-token';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users/me (GET) deve retornar o usuário autenticado', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('user@example.com');
  });

  it('/users/me (PATCH) deve atualizar o nome do usuário', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Novo Nome' });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Novo Nome');
  });

  it('/users/me (DELETE) deve deletar o usuário', async () => {
    const res = await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});
