import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BoardRole, Prisma, User, UserKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_GUEST_TTL_MS } from './demo.constants';

/** Demo teammates, seeded by the demo_accounts migration. */
const ALEX = '00000000-0000-4000-8000-000000000001';
const SAM = '00000000-0000-4000-8000-000000000002';
const JORDAN = '00000000-0000-4000-8000-000000000003';

const GUEST = 'guest';
type Author = typeof GUEST | typeof ALEX | typeof SAM;

interface SeedSticker {
  content: string;
  author: Author;
  votes: { userId: string; count: number }[];
}

const COLUMNS: { title: string; stickers: SeedSticker[] }[] = [
  {
    title: 'Went Well',
    stickers: [
      {
        content: 'Release went out on Friday without a rollback',
        author: ALEX,
        votes: [{ userId: SAM, count: 1 }],
      },
      {
        content: 'Pairing on the payment bug saved us two days',
        author: SAM,
        votes: [
          { userId: ALEX, count: 1 },
          { userId: JORDAN, count: 2 },
        ],
      },
      {
        content:
          'Try it: vote with dots, drag the columns, change roles under Share',
        author: GUEST,
        votes: [],
      },
    ],
  },
  {
    title: 'To Improve',
    stickers: [
      {
        content: 'Flaky e2e tests block merges',
        author: ALEX,
        votes: [
          { userId: ALEX, count: 2 },
          { userId: SAM, count: 2 },
          { userId: JORDAN, count: 1 },
        ],
      },
      {
        content: 'Stand-ups keep running past 15 minutes',
        author: SAM,
        votes: [
          { userId: SAM, count: 1 },
          { userId: JORDAN, count: 1 },
        ],
      },
    ],
  },
  {
    title: 'Action Items',
    stickers: [
      {
        content: 'Timebox stand-ups, park topics for after',
        author: SAM,
        votes: [],
      },
      {
        content: 'Quarantine flaky tests and fix one per day',
        author: GUEST,
        votes: [{ userId: ALEX, count: 1 }],
      },
    ],
  },
];

@Injectable()
export class DemoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a guest who owns a seeded board shared with the demo teammates.
   *
   * Expired guests are swept first: deleting the User cascades to their boards,
   * and with them to the teammates' memberships, stickers and votes. Ids are
   * generated up front so the votes can reference the board and its stickers
   * in the same transaction. The guest's password hash is not a bcrypt hash,
   * so no password matches it.
   */
  async createGuest(): Promise<User> {
    await this.prisma.user.deleteMany({
      where: { kind: UserKind.GUEST, expiresAt: { lt: new Date() } },
    });

    const guestId = randomUUID();
    const boardId = randomUUID();
    const authorId = (author: Author) => (author === GUEST ? guestId : author);

    const votes: Prisma.VoteCreateManyInput[] = [];
    const columns = COLUMNS.map((column, columnOrder) => ({
      title: column.title,
      order: columnOrder,
      stickers: {
        create: column.stickers.map((sticker, order) => {
          const stickerId = randomUUID();
          for (const vote of sticker.votes) {
            votes.push({ stickerId, boardId, ...vote });
          }
          return {
            id: stickerId,
            content: sticker.content,
            order,
            authorId: authorId(sticker.author),
          };
        }),
      },
    }));

    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          id: guestId,
          email: `guest-${guestId}@example.com`,
          passwordHash: '!',
          name: 'Guest',
          kind: UserKind.GUEST,
          expiresAt: new Date(Date.now() + DEMO_GUEST_TTL_MS),
        },
      }),
      this.prisma.board.create({
        data: {
          id: boardId,
          title: 'Sprint retro (demo)',
          ownerId: guestId,
          columns: { create: columns },
          members: {
            create: [
              { userId: ALEX, role: BoardRole.EDITOR },
              { userId: SAM, role: BoardRole.EDITOR },
              { userId: JORDAN, role: BoardRole.VIEWER },
            ],
          },
        },
      }),
      this.prisma.vote.createMany({ data: votes }),
    ]);

    return user;
  }
}
