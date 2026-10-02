import type { NestExpressApplication } from '@nestjs/platform-express';
import { MAX_VOTES_COUNT } from '../src/votes/votes.constants';
import {
  addMember,
  createBoard,
  createSticker,
  createTestApp,
  signUp,
  type TestBoard,
  type TestUser,
} from './helpers';

interface BoardPayload {
  myVotes: { spent: number; left: number; max: number };
  columns: {
    stickers: { id: string; votes: { total: number; mine: number } }[];
  }[];
}

describe('votes (e2e)', () => {
  let app: NestExpressApplication;
  let owner: TestUser;
  let board: TestBoard;

  beforeAll(async () => {
    app = await createTestApp();
    owner = await signUp(app);
    board = await createBoard(owner);
  });

  afterAll(async () => {
    await app.close();
  });

  async function myVotes(user: TestUser): Promise<BoardPayload['myVotes']> {
    const res = await user.agent.get(`/boards/${board.id}`).expect(200);
    return (res.body as BoardPayload).myVotes;
  }

  it('a viewer can vote', async () => {
    const viewer = await signUp(app);
    await addMember(owner, board.id, viewer, 'VIEWER');
    const sticker = await createSticker(owner, board.columnIds[0]);

    await viewer.agent.post(`/stickers/${sticker}/votes`).expect(201);
    expect(await myVotes(viewer)).toMatchObject({ spent: 1 });
  });

  it('never exceeds the budget under concurrent votes', async () => {
    const voter = await signUp(app);
    await addMember(owner, board.id, voter, 'VIEWER');
    const stickers = await Promise.all(
      [0, 1].map((i) => createSticker(owner, board.columnIds[i])),
    );

    // Twice the budget at once, split across two stickers so the transactions
    // touch different Vote rows and only the budget read ties them together.
    const responses = await Promise.all(
      Array.from({ length: MAX_VOTES_COUNT * 2 }, (_, i) =>
        voter.agent.post(`/stickers/${stickers[i % 2]}/votes`),
      ),
    );
    const statuses = responses.map((r) => r.status);
    const accepted = statuses.filter((s) => s === 201).length;

    // 403 is the budget, 409 is contention that outlasted the retries.
    // Neither may be a 500, and nothing may slip past the limit.
    expect(statuses.every((s) => [201, 403, 409].includes(s))).toBe(true);
    expect(accepted).toBeLessThanOrEqual(MAX_VOTES_COUNT);
    expect(await myVotes(voter)).toMatchObject({ spent: accepted });

    // Whatever contention cost, the budget is still exactly MAX_VOTES_COUNT.
    for (let i = accepted; i < MAX_VOTES_COUNT; i++) {
      await voter.agent.post(`/stickers/${stickers[0]}/votes`).expect(201);
    }
    await voter.agent.post(`/stickers/${stickers[0]}/votes`).expect(403);
    expect(await myVotes(voter)).toEqual({
      spent: MAX_VOTES_COUNT,
      left: 0,
      max: MAX_VOTES_COUNT,
    });
  });

  it('deleting a sticker refunds its dots', async () => {
    const voter = await signUp(app);
    await addMember(owner, board.id, voter, 'VIEWER');
    const sticker = await createSticker(owner, board.columnIds[0]);

    await voter.agent.post(`/stickers/${sticker}/votes`).expect(201);
    await voter.agent.post(`/stickers/${sticker}/votes`).expect(201);
    expect(await myVotes(voter)).toMatchObject({ spent: 2 });

    await owner.agent.delete(`/stickers/${sticker}`).expect(200);
    expect(await myVotes(voter)).toMatchObject({ spent: 0 });
  });

  it('removing a vote that does not exist is 404, counts never go negative', async () => {
    const voter = await signUp(app);
    await addMember(owner, board.id, voter, 'VIEWER');
    const sticker = await createSticker(owner, board.columnIds[0]);

    await voter.agent.delete(`/stickers/${sticker}/votes`).expect(404);
  });
});
