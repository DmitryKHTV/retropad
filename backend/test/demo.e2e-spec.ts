import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { PrismaService } from '../src/prisma/prisma.service';
import { PASSWORD, createBoard, createTestApp, server, signUp } from './helpers';

const TEAMMATE_EMAIL = 'alex.demo@example.com';

interface DemoGuest {
  id: string;
  email: string;
  boardId: string;
  agent: TestAgent;
}

interface Member {
  role: string;
  user: { id: string; email: string };
}

describe('demo login (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function startDemo(): Promise<DemoGuest> {
    const agent = request.agent(server(app));
    const res = await agent.post('/auth/demo').expect(201);
    const { user } = res.body as { user: { id: string; email: string } };
    const boards = await agent.get('/boards').expect(200);
    const [board] = boards.body as { id: string }[];
    return { ...user, boardId: board.id, agent };
  }

  async function members(guest: DemoGuest): Promise<Member[]> {
    const res = await guest.agent
      .get(`/boards/${guest.boardId}/members`)
      .expect(200);
    return res.body as Member[];
  }

  it('creates a guest who owns a seeded board shared with the teammates', async () => {
    const guest = await startDemo();

    await guest.agent.get('/auth/me').expect(200);
    const board = await guest.agent.get(`/boards/${guest.boardId}`).expect(200);
    const body = board.body as {
      myRole: string;
      myVotes: { left: number };
      columns: { stickers: { votes: { total: number } }[] }[];
    };

    expect(body.myRole).toBe('OWNER');
    expect(body.myVotes.left).toBe(5);
    const stickers = body.columns.flatMap((c) => c.stickers);
    expect(stickers.length).toBeGreaterThan(0);
    expect(stickers.some((s) => s.votes.total > 0)).toBe(true);
    expect((await members(guest)).map((m) => m.role)).toEqual([
      'OWNER',
      'EDITOR',
      'EDITOR',
      'VIEWER',
    ]);
  });

  it('lets the guest change a teammate role', async () => {
    const guest = await startDemo();
    const teammate = (await members(guest)).find((m) => m.role === 'EDITOR')!;

    await guest.agent
      .patch(`/boards/${guest.boardId}/members/${teammate.user.id}`)
      .send({ role: 'VIEWER' })
      .expect(200);
  });

  it('does not let anyone log in as a teammate', async () => {
    const res = await request(server(app))
      .post('/auth/login')
      .send({ email: TEAMMATE_EMAIL, password: PASSWORD })
      .expect(401);

    expect(res.body).toMatchObject({ message: 'Invalid credentials' });
  });

  it('hides demo accounts from member lookups by email', async () => {
    const owner = await signUp(app);
    const board = await createBoard(owner);
    const guest = await startDemo();

    for (const email of [TEAMMATE_EMAIL, guest.email]) {
      await owner.agent
        .post(`/boards/${board.id}/members`)
        .send({ email })
        .expect(404);
    }
  });

  it('does not let a guest add members by email', async () => {
    const someone = await signUp(app);
    const guest = await startDemo();

    await guest.agent
      .post(`/boards/${guest.boardId}/members`)
      .send({ email: someone.email })
      .expect(403);
  });

  it('deletes the guest and their board on logout', async () => {
    const guest = await startDemo();

    await guest.agent.post('/auth/logout').expect(204);

    expect(await prisma.user.findUnique({ where: { id: guest.id } })).toBeNull();
    expect(
      await prisma.board.findUnique({ where: { id: guest.boardId } }),
    ).toBeNull();
  });

  it('rejects an expired guest and sweeps it on the next demo login', async () => {
    const guest = await startDemo();
    await prisma.user.update({
      where: { id: guest.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await guest.agent.get('/auth/me').expect(401);
    await startDemo();

    expect(await prisma.user.findUnique({ where: { id: guest.id } })).toBeNull();
  });
});
