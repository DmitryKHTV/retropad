import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {Sticker} from "@prisma/client";
import {CreateStickerDto, UpdateStickerDto} from "./dto";
import {BoardAccessService} from "../board-access/board-access.service";
import {BoardEventsService} from "../realtime/board-events.service";

@Injectable()
export class StickersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly boardAccess: BoardAccessService,
        private readonly boardEvents: BoardEventsService
    ) {}

    async create(dto: CreateStickerDto, requesterId: string, socketId?: string): Promise<Sticker> {
        const column = await this.prisma.column.findUnique({
            where: {id: dto.columnId},
            select: {boardId: true},
        });
        if (!column) {
            throw new NotFoundException(`Column ${dto.columnId} not found`);
        }
        await this.boardAccess.assertCanEdit(column.boardId, requesterId);
        const lastStickerInColumn = await this.prisma.sticker.findFirst({where: {columnId: dto.columnId}, orderBy: {order: "desc"}, select: {order: true}});
        const nextOrder = (lastStickerInColumn?.order ?? -1) + 1;
        const newSticker = await this.prisma.sticker.create({data: {...dto, order: nextOrder, authorId: requesterId}});
        this.boardEvents.boardChanged(column.boardId, socketId);
        return newSticker;
    }

    async update(id: string, dto: UpdateStickerDto, requesterId: string, socketId?: string): Promise<Sticker> {
        const current = await this.prisma.sticker.findUnique({
            where: {id},
            select: {
                columnId: true,
                order: true,
                column: {select: {boardId: true}},
                authorId: true
            },
        });
        if (!current) {
            throw new NotFoundException(`Sticker ${id} not found`);
        }

        await this.boardAccess.assertCanTouchSticker(current.column.boardId, requesterId, current.authorId);

        const newColumnId = dto.columnId ?? current.columnId;
        const newOrder = dto.order ?? current.order;
        const isMoving = newColumnId !== current.columnId || newOrder !== current.order;

        if (!isMoving) {
            const updated = await this.prisma.sticker.update({where: {id}, data: dto});
            this.boardEvents.boardChanged(current.column.boardId, socketId);
            return updated;
        }

        // Emit only after the transaction has committed — an event sent from
        // inside would advertise a state other clients can't read yet (or ever,
        // if the transaction rolls back).
        const moved = await this.prisma.$transaction(async (tx) => {
            if (newColumnId !== current.columnId) {
                const targetColumn = await tx.column.findUnique({
                    where: {id: newColumnId},
                    select: {boardId: true},
                });
                if (!targetColumn) {
                    throw new NotFoundException(`Column ${newColumnId} not found`);
                }
                if (targetColumn.boardId !== current.column.boardId) {
                    throw new ForbiddenException("Cannot move sticker to a different board");
                }

                await tx.sticker.updateMany({
                    where: {columnId: current.columnId, order: {gt: current.order}},
                    data: {order: {decrement: 1}},
                });
                await tx.sticker.updateMany({
                    where: {columnId: newColumnId, order: {gte: newOrder}},
                    data: {order: {increment: 1}},
                });
            } else if (newOrder > current.order) {
                await tx.sticker.updateMany({
                    where: {columnId: current.columnId, order: {gt: current.order, lte: newOrder}},
                    data: {order: {decrement: 1}},
                });
            } else {
                await tx.sticker.updateMany({
                    where: {columnId: current.columnId, order: {gte: newOrder, lt: current.order}},
                    data: {order: {increment: 1}},
                });
            }

            return tx.sticker.update({where: {id}, data: dto});
        });
        this.boardEvents.boardChanged(current.column.boardId, socketId);
        return moved;
    }

    async remove(id: string, requesterId: string, socketId?: string): Promise<Sticker> {
        const sticker = await this.prisma.sticker.findUnique({
            where: {id},
            select: {column: {select: {boardId: true}}, authorId: true},
        });
        if (!sticker) {
            throw new NotFoundException(`Sticker ${id} not found`);
        }
        await this.boardAccess.assertCanTouchSticker(sticker.column.boardId, requesterId, sticker.authorId);
        const deleted = await this.prisma.sticker.delete({where: {id}});
        this.boardEvents.boardChanged(sticker.column.boardId, socketId);
        return deleted;
    }
}
