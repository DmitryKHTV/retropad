import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  PASSWORD,
  createTestApp,
  server,
  signUp,
  uniqueEmail,
} from './helpers';

describe('auth (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register sets httpOnly auth cookies and returns the user without a password hash', async () => {
    const email = uniqueEmail();
    const res = await request(server(app))
      .post('/auth/register')
      .send({ email, password: PASSWORD })
      .expect(201);

    const cookies = res.get('Set-Cookie') ?? [];
    expect(
      cookies.some(
        (c) => c.startsWith('access_token=') && c.includes('HttpOnly'),
      ),
    ).toBe(true);
    expect(
      cookies.some(
        (c) => c.startsWith('refresh_token=') && c.includes('HttpOnly'),
      ),
    ).toBe(true);
    const body = res.body as { user: Record<string, unknown> };
    expect(body.user.email).toBe(email);
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('the cookie from login authenticates /auth/me', async () => {
    const user = await signUp(app);
    const agent = request.agent(server(app));

    await agent
      .post('/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(200);
    const me = await agent.get('/auth/me').expect(200);

    expect(me.body).toMatchObject({ id: user.id, email: user.email });
  });

  it('rejects requests without a cookie with 401', async () => {
    await request(server(app)).get('/auth/me').expect(401);
    await request(server(app)).get('/boards').expect(401);
  });

  it('answers the same for an unknown email and a wrong password', async () => {
    const user = await signUp(app);

    const unknown = await request(server(app))
      .post('/auth/login')
      .send({ email: uniqueEmail(), password: PASSWORD })
      .expect(401);
    const wrongPassword = await request(server(app))
      .post('/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);

    expect(wrongPassword.body).toEqual(unknown.body);
  });

  it('rejects a duplicate email with 409', async () => {
    const user = await signUp(app);

    await request(server(app))
      .post('/auth/register')
      .send({ email: user.email, password: PASSWORD })
      .expect(409);
  });

  it('rejects unknown fields with 400 (whitelist + forbidNonWhitelisted)', async () => {
    await request(server(app))
      .post('/auth/register')
      .send({ email: uniqueEmail(), password: PASSWORD, isAdmin: true })
      .expect(400);
  });
});
