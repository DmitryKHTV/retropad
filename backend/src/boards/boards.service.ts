import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import { Board, Prisma } from '@prisma/client';

export type BoardWithColumns = Prisma.BoardGetPayload<{
    include: {
        columns: {
            include: {stickers: {orderBy: {order: 'asc'}}};
            orderBy: {order: 'asc'};
        };
    };
}>;

@Injectable()
export class BoardsService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(): Promise<Board[]> {
        return this.prisma.board.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, requesterId: string): Promise<BoardWithColumns> {
        const board = await this.prisma.board.findUnique({
            where: { id },
            include: {
                columns: {
                    include: {stickers: {orderBy: {order: 'asc'}}},
                    orderBy: {order: 'asc'},
                },
            },
        });
        if (!board) {
            throw new NotFoundException(`Board with id ${id} not found`);
        }
        if (board.ownerId !== requesterId) {
            throw new ForbiddenException('You do not have access to this board');
        }
        return board;
    }

    findAllByOwner(ownerId: string): Promise<Board[]> {
        return this.prisma.board.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
        });
    }

    create(title: string, ownerId: string): Promise<Board> {
        return this.prisma.board.create({
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
    }

    async remove(id: string, requesterId: string): Promise<Board> {
        const board = await this.prisma.board.findUnique({ where: { id } });

        if (!board) {
            throw new NotFoundException(`Board with id ${id} not found`);
        }

        if (board.ownerId !== requesterId) {
            throw new ForbiddenException('You do not have access to this board');
        }

        return this.prisma.board.delete({ where: { id } });
    }
}
