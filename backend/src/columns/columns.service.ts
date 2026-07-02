import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {Column} from "@prisma/client";
import {CreateColumnDto, UpdateColumnDto} from "./dto";
import {BoardAccessService} from "../board-access/board-access.service";

@Injectable()
export class ColumnsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly boardAccess: BoardAccessService,
    ) {}

    async findAllByBoard(boardId: string, requestedId: string): Promise<Column[]> {
        await this.boardAccess.assertCanView(boardId, requestedId);
        return this.prisma.column.findMany({where: {boardId}});
    }

    async create(dto: CreateColumnDto, requestedId: string): Promise<Column> {
        await this.boardAccess.assertCanEdit(dto.boardId, requestedId);
        return this.prisma.column.create({data: dto});
    }

    async update(dto: UpdateColumnDto, requesterId: string, columnId: string): Promise<Column> {
        const current = await this.prisma.column.findUnique({
            where: {id: columnId},
            select: {
                order: true,
                boardId: true,
            },
        });

        if (!current) { throw new NotFoundException("No such column"); }
        await this.boardAccess.assertCanEdit(current.boardId, requesterId);

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
            select: {boardId: true},
        });

        if (!current) { throw new NotFoundException("No such column"); }
        await this.boardAccess.assertCanEdit(current.boardId, requesterId);

        return this.prisma.column.delete({where: {id: columnId}});
    }
}
