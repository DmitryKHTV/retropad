import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

export const PASSWORD = 'password123';

export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    // Every test registers fresh users from one address, which would trip the
    // /auth rate limits within a single run.
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return app;
}

export function server(app: NestExpressApplication): App {
  return app.getHttpServer();
}

export function uniqueEmail(): string {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export interface TestUser {
  id: string;
  email: string;
  // An agent keeps the cookies from register, so its requests are authenticated.
  agent: TestAgent;
}

export async function signUp(app: NestExpressApplication): Promise<TestUser> {
  const agent = request.agent(server(app));
  const email = uniqueEmail();
  const res = await agent
    .post('/auth/register')
    .send({ email, password: PASSWORD, name: 'E2E User' })
    .expect(201);
  const body = res.body as { user: { id: string } };
  return { id: body.user.id, email, agent };
}

export interface TestBoard {
  id: string;
  columnIds: string[];
}

export async function createBoard(owner: TestUser): Promise<TestBoard> {
  const created = await owner.agent
    .post('/boards')
    .send({ title: 'E2E Retro' })
    .expect(201);
  const { id } = created.body as { id: string };
  const full = await owner.agent.get(`/boards/${id}`).expect(200);
  const { columns } = full.body as { columns: { id: string }[] };
  return { id, columnIds: columns.map((c) => c.id) };
}

export async function createSticker(
  author: TestUser,
  columnId: string,
): Promise<string> {
  const res = await author.agent
    .post('/stickers')
    .send({ columnId, content: 'E2E sticker' })
    .expect(201);
  return (res.body as { id: string }).id;
}

export async function addMember(
  owner: TestUser,
  boardId: string,
  member: TestUser,
  role: 'EDITOR' | 'VIEWER',
): Promise<void> {
  await owner.agent
    .post(`/boards/${boardId}/members`)
    .send({ email: member.email, role })
    .expect(201);
}
