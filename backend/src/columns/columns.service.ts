import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {Column} from "@prisma/client";
import {CreateColumnDto, UpdateColumnDto} from "./dto";
import {BoardAccessService} from "../board-access/board-access.service";
import {BoardEventsService} from "../realtime/board-events.service";

@Injectable()
export class ColumnsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly boardAccess: BoardAccessService,
        private readonly boardEvents: BoardEventsService,
    ) {}

    async findAllByBoard(boardId: string, requestedId: string): Promise<Column[]> {
        await this.boardAccess.assertCanView(boardId, requestedId);
        return this.prisma.column.findMany({where: {boardId}});
    }

    // Columns are board structure, so all mutations are OWNER-only. Letting
    // EDITOR delete a column would cascade-delete other people's stickers,
    // bypassing the "EDITOR touches only own stickers" rule.
    async create(dto: CreateColumnDto, requestedId: string, socketId?: string): Promise<Column> {
        await this.boardAccess.assertCanManage(dto.boardId, requestedId);
        const column = await this.prisma.column.create({data: dto});
        this.boardEvents.boardChanged(dto.boardId, socketId);
        return column;
    }

    async update(dto: UpdateColumnDto, requesterId: string, columnId: string, socketId?: string): Promise<Column> {
        const current = await this.prisma.column.findUnique({
            where: {id: columnId},
            select: {
                order: true,
                boardId: true,
            },
        });

        if (!current) { throw new NotFoundException("No such column"); }
        await this.boardAccess.assertCanManage(current.boardId, requesterId);

        const newOrder = dto.order ?? current.order;
        const isMoving = newOrder !== current.order;

        if (!isMoving) {
            const updated = await this.prisma.column.update({where: {id: columnId}, data: dto});
            this.boardEvents.boardChanged(current.boardId, socketId);
            return updated;
        }

        // Emit only after the transaction has committed (see StickersService.update)
        const moved = await this.prisma.$transaction(async (tx) => {
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
        this.boardEvents.boardChanged(current.boardId, socketId);
        return moved;
    }

    async remove(columnId: string, requesterId: string, socketId?: string): Promise<Column> {
        const current = await this.prisma.column.findUnique({
            where: {id: columnId},
            select: {boardId: true},
        });

        if (!current) { throw new NotFoundException("No such column"); }
        await this.boardAccess.assertCanManage(current.boardId, requesterId);

        const deleted = await this.prisma.column.delete({where: {id: columnId}});
        this.boardEvents.boardChanged(current.boardId, socketId);
        return deleted;
    }
}
