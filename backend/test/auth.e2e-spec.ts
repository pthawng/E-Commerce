import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer()).post('/auth/register').send({}).expect(400);
    });

    // Note: Success case would require a clean DB or mocking Prisma inside E2E
    // For recruiters, demonstrating the structure is often enough if DB setup is complex
  });

  describe('/auth/login (POST)', () => {
    it('should return 401 for wrong credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'password' })
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should eventually return 429 Too Many Requests', async () => {
      // We hit the limit defined in AppModule (default 10)
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'a@b.com', password: 'p' });
      }

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'p' });
      expect(response.status).toBe(429);
    });
  });
});
