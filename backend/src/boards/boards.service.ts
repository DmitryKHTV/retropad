import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import { Board, Prisma } from '@prisma/client';
import {UpdateBoardDto} from "./dto";
import {BoardAccessService, type EffectiveRole} from "../board-access/board-access.service";
import {BoardEventsService} from "../realtime/board-events.service";

export type BoardWithColumns = Prisma.BoardGetPayload<{
    include: {
        columns: {
            include: {stickers: {orderBy: {order: 'asc'}}};
            orderBy: {order: 'asc'};
        };
    };
}>;

export type BoardWithRole = Board & {myRole: EffectiveRole};
export type BoardWithColumnsAndRole = BoardWithColumns & {myRole: EffectiveRole};

@Injectable()
export class BoardsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly boardAccess: BoardAccessService,
        private readonly boardEvents: BoardEventsService,
    ) {}

    async findOne(id: string, requesterId: string): Promise<BoardWithColumnsAndRole> {
        const board = await this.prisma.board.findUnique({
            where: { id },
            include: {
                columns: {
                    include: {stickers: {orderBy: {order: 'asc'}, include: {author: {select: {id: true, name: true, email: true}}}}},
                    orderBy: {order: 'asc'},
                },
            },
        });
        if (!board) {
            throw new NotFoundException(`Board with id ${id} not found`);
        }
        const myRole = await this.boardAccess.assertCanView(id, requesterId);
        return { ...board, myRole };
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
