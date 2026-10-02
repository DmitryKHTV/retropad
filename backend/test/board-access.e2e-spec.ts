import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  addMember,
  createBoard,
  createSticker,
  createTestApp,
  signUp,
  type TestBoard,
  type TestUser,
} from './helpers';

describe('board access (e2e)', () => {
  let app: NestExpressApplication;
  let owner: TestUser;
  let editor: TestUser;
  let viewer: TestUser;
  let outsider: TestUser;
  let board: TestBoard;

  beforeAll(async () => {
    app = await createTestApp();
    [owner, editor, viewer, outsider] = await Promise.all([
      signUp(app),
      signUp(app),
      signUp(app),
      signUp(app),
    ]);
    board = await createBoard(owner);
    await addMember(owner, board.id, editor, 'EDITOR');
    await addMember(owner, board.id, viewer, 'VIEWER');
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 404 for a board that does not exist', async () => {
    await owner.agent.get(`/boards/${randomUUID()}`).expect(404);
  });

  it('answers 403, not 404, for an existing board without access', async () => {
    await outsider.agent.get(`/boards/${board.id}`).expect(403);
  });

  it('reports the resolved role of each member as myRole', async () => {
    for (const [user, role] of [
      [owner, 'OWNER'],
      [editor, 'EDITOR'],
      [viewer, 'VIEWER'],
    ] as const) {
      const res = await user.agent.get(`/boards/${board.id}`).expect(200);
      expect(res.body).toMatchObject({ myRole: role });
    }
  });

  it('a viewer cannot create stickers', async () => {
    await viewer.agent
      .post('/stickers')
      .send({ columnId: board.columnIds[0], content: 'Read-only' })
      .expect(403);
  });

  it('an editor changes own stickers but not those of others', async () => {
    const own = await createSticker(editor, board.columnIds[0]);
    const ownersSticker = await createSticker(owner, board.columnIds[0]);

    await editor.agent
      .patch(`/stickers/${own}`)
      .send({ content: 'Edited' })
      .expect(200);
    await editor.agent
      .patch(`/stickers/${ownersSticker}`)
      .send({ content: 'Edited' })
      .expect(403);
    await editor.agent.delete(`/stickers/${ownersSticker}`).expect(403);
  });

  it('the owner moderates any sticker', async () => {
    const editorsSticker = await createSticker(editor, board.columnIds[0]);

    await owner.agent.delete(`/stickers/${editorsSticker}`).expect(200);
  });

  it('only the owner manages columns and members', async () => {
    await editor.agent.delete(`/columns/${board.columnIds[2]}`).expect(403);
    await editor.agent
      .post(`/boards/${board.id}/members`)
      .send({ email: outsider.email })
      .expect(403);
  });

  it('rejects moving a sticker to another board, even one the user owns', async () => {
    const otherBoard = await createBoard(owner);
    const sticker = await createSticker(owner, board.columnIds[0]);

    await owner.agent
      .patch(`/stickers/${sticker}`)
      .send({ columnId: otherBoard.columnIds[0] })
      .expect(403);
  });
});
