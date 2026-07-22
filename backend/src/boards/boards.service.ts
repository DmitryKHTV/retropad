import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import { Board, Prisma } from '@prisma/client';
import {UpdateBoardDto} from "./dto";
import {BoardAccessService, type EffectiveRole} from "../board-access/board-access.service";
import {BoardEventsService} from "../realtime/board-events.service";
import {MAX_VOTES_COUNT} from "../votes/votes.constants";

export type BoardWithColumns = Prisma.BoardGetPayload<{
    include: {
        columns: {
            include: {
                stickers: {
                    orderBy: {order: 'asc'};
                    include: {author: {select: {id: true; name: true; email: true}}};
                };
            };
            orderBy: {order: 'asc'};
        };
    };
}>;

type RawColumn = BoardWithColumns['columns'][number];
type RawSticker = RawColumn['stickers'][number];

// Votes are exposed as aggregates only — who voted for what never leaves the
// server, so dot-voting stays anonymous.
export type StickerVotes = {total: number; mine: number};
export type StickerWithVotes = RawSticker & {votes: StickerVotes};
export type ColumnWithVotes = Omit<RawColumn, 'stickers'> & {stickers: StickerWithVotes[]};

export type BoardWithRole = Board & {myRole: EffectiveRole};
export type BoardWithColumnsAndRole = Omit<BoardWithColumns, 'columns'> & {
    columns: ColumnWithVotes[];
    myRole: EffectiveRole;
    myVotes: {spent: number; left: number; max: number};
};

@Injectable()
export class BoardsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly boardAccess: BoardAccessService,
        private readonly boardEvents: BoardEventsService,
    ) {}

    async findOne(id: string, requesterId: string): Promise<BoardWithColumnsAndRole> {
        const myRole = await this.boardAccess.assertCanView(id, requesterId);

        const [board, totals, myVotes] = await this.prisma.$transaction([
            this.prisma.board.findUnique({
                where: { id },
                include: {
                    columns: {
                        include: {stickers: {orderBy: {order: 'asc'}, include: {author: {select: {id: true, name: true, email: true}}}}},
                        orderBy: {order: 'asc'},
                    },
                },
            }),
            this.prisma.vote.groupBy({
                by: ['stickerId'],
                where: {boardId: id},
                _sum: {count: true},
                orderBy: {stickerId: 'asc'},
            }),
            this.prisma.vote.findMany({
                where: {boardId: id, userId: requesterId},
                select: {stickerId: true, count: true},
            }),

        ]);
        if (!board) {
            throw new NotFoundException(`Board with id ${id} not found`);
        }

        const totalBySticker = new Map(totals.map((row) => [row.stickerId, row._sum?.count ?? 0]));
        const mineBySticker = new Map(myVotes.map((vote) => [vote.stickerId, vote.count]));
        const spent = myVotes.reduce((sum, vote) => sum + vote.count, 0);

        return {
            ...board,
            columns: board.columns.map((column) => ({
                ...column,
                stickers: column.stickers.map((sticker) => ({
                    ...sticker,
                    votes: {
                        total: totalBySticker.get(sticker.id) ?? 0,
                        mine: mineBySticker.get(sticker.id) ?? 0,
                    },
                })),
            })),
            myRole,
            myVotes: {spent, left: MAX_VOTES_COUNT - spent, max: MAX_VOTES_COUNT},
        };
    }

    // Boards the user owns OR is a member of, each annotated with the user's role
    async findAllForViewer(userId: string): Promise<BoardWithRole[]> {
        const boards = await this.prisma.board.findMany({
            where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
            orderBy: { createdAt: 'desc' },
            include: { members: { where: { userId }, select: { role: true } } },
        });
        return boards.map(({ members, ...board }) => ({
            ...board,
            myRole: board.ownerId === userId ? 'OWNER' : (members[0]?.role ?? 'VIEWER'),
        }));
    }

    // Every board payload carries myRole; on create/update/remove the requester
    // is always the owner (enforced by assertCanManage / creation itself)
    async create(title: string, ownerId: string): Promise<BoardWithRole> {
        const board = await this.prisma.board.create({
            data: {
                title,
                ownerId,
                columns: {
                    create: [
                        {title: "Went Well", order: 0},
                        {title: "To Improve", order: 1},
                        {title: "Action Items", order: 2},
                    ],
                },
            },
        });
        return { ...board, myRole: 'OWNER' };
    }

    async update(id: string, requesterId: string, dto: UpdateBoardDto, socketId?: string): Promise<BoardWithRole> {
        await this.boardAccess.assertCanManage(id, requesterId);
        const board = await this.prisma.board.update({ where: { id }, data: dto });
        this.boardEvents.boardChanged(id, socketId);
        return { ...board, myRole: 'OWNER' };
    }

    // No emit on create: the board has no room (nobody could have joined it yet)

    async remove(id: string, requesterId: string, socketId?: string): Promise<BoardWithRole> {
        await this.boardAccess.assertCanManage(id, requesterId);
        const board = await this.prisma.board.delete({ where: { id } });
        this.boardEvents.boardChanged(id, socketId);
        return { ...board, myRole: 'OWNER' };
    }
}
