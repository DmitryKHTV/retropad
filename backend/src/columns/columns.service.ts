import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {Column} from "@prisma/client";
import {CreateColumnDto, UpdateColumnDto} from "./dto";

@Injectable()
export class ColumnsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAllByBoard(boardId: string, requestedId: string): Promise<Column[]> {
        const currentBoard = await this.prisma.board.findUnique({where: {id: boardId}});
        if (!currentBoard) { throw new NotFoundException("No such board"); }
        if (currentBoard.ownerId !== requestedId) { throw new ForbiddenException("You're not an owner of this board"); }
        return this.prisma.column.findMany({where: {boardId}});
    }

    async create(dto: CreateColumnDto, requestedId: string): Promise<Column> {
        const currentBoard = await this.prisma.board.findUnique({where: {id: dto.boardId}});
        if (!currentBoard) { throw new NotFoundException("No such board"); }
        if (currentBoard.ownerId !== requestedId) { throw new ForbiddenException("You're not an owner of this board"); }
        return this.prisma.column.create({data: dto});
    }

    async update(dto: UpdateColumnDto, requesterId: string, columnId: string): Promise<Column> {
        const current = await this.prisma.column.findUnique({
            where: {id: columnId},
            select: {
                order: true,
                boardId: true,
                board: {select: {ownerId: true}},
            },
        });

        if (!current) { throw new NotFoundException("No such column"); }
        if (current.board.ownerId !== requesterId) { throw new ForbiddenException("You're not an owner of this board"); }

        const newOrder = dto.order ?? current.order;
        const isMoving = newOrder !== current.order;

        if (!isMoving) {
            return this.prisma.column.update({where: {id: columnId}, data: dto});
        }

        return this.prisma.$transaction(async (tx) => {
            if (newOrder > current.order) {
                await tx.column.updateMany({
                    where: {boardId: current.boardId, order: {gt: current.order, lte: newOrder}},
                    data: {order: {decrement: 1}},
                });
            } else {
                await tx.column.updateMany({
                    where: {boardId: current.boardId, order: {gte: newOrder, lt: current.order}},
                    data: {order: {increment: 1}},
                });
            }
            return tx.column.update({where: {id: columnId}, data: dto});
        });
    }

    async remove(columnId: string, requesterId: string): Promise<Column> {
        const current = await this.prisma.column.findUnique({
            where: {id: columnId},
            select: {board: {select: {ownerId: true}}},
        });

        if (!current) { throw new NotFoundException("No such column"); }
        if (current.board.ownerId !== requesterId) { throw new ForbiddenException("You're not an owner of this board"); }

        return this.prisma.column.delete({where: {id: columnId}});
    }
}
