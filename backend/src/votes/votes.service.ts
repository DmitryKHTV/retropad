import {ConflictException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {BoardAccessService} from "../board-access/board-access.service";
import {BoardEventsService} from "../realtime/board-events.service";
import {Prisma, Vote} from "@prisma/client";
import {MAX_VOTES_COUNT, SERIALIZATION_MAX_ATTEMPTS} from "./votes.constants";

@Injectable()
export class VotesService {
    constructor(private readonly prisma: PrismaService,
                private readonly boardAccess: BoardAccessService,
                private readonly boardEvents: BoardEventsService) {}

    // Serializable aborts a transaction (P2034) when concurrent votes on the same
    // board interleave in a way that no serial order could produce. That is the
    // isolation level working, not a failure — the transaction never applied, so
    // replaying it is safe. Giving up only after repeated aborts, and as 409
    // rather than 500, because by then it's contention, not a server fault.
    private async withSerializableRetry<T>(work: () => Promise<T>): Promise<T> {
        for (let attempt = 1; attempt <= SERIALIZATION_MAX_ATTEMPTS; attempt++) {
            try {
                return await work();
            } catch (e) {
                const isSerializationFailure =
                    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034';
                if (!isSerializationFailure) throw e;
                if (attempt === SERIALIZATION_MAX_ATTEMPTS) {
                    throw new ConflictException('Too much concurrent voting on this board, please retry');
                }
                // Jittered backoff: retrying in lockstep would just reproduce the
                // same collision between the same two transactions.
                await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
            }
        }
        // Unreachable: the loop either returns or throws. TypeScript can't see that.
        throw new ConflictException('Too much concurrent voting on this board, please retry');
    }

    private async resolveBoardIdOrThrow(stickerId: string): Promise<string> {
        const sticker = await this.prisma.sticker.findUnique({
            where: {id: stickerId},
            select: {column: {select: {boardId: true}}},
        });
        if (!sticker) {
            throw new NotFoundException(`Sticker ${stickerId} not found`);
        }
        return sticker.column.boardId;
    }

    async addVote(stickerId: string, requesterId: string, socketId?: string): Promise<Vote> {
        const boardId = await this.resolveBoardIdOrThrow(stickerId);
        await this.boardAccess.assertCanView(boardId, requesterId);
        const vote = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
            // Single-table thanks to the denormalized boardId: under Serializable
            // this keeps the predicate lock on a narrow slice of one index instead
            // of spanning Vote + Sticker + Column.
            const spent = await tx.vote.aggregate({
                _sum: {count: true},
                where: {userId: requesterId, boardId},
            });
            const spentCount = spent._sum.count ?? 0;
            if (spentCount >= MAX_VOTES_COUNT) throw new ForbiddenException(`Vote limit of ${MAX_VOTES_COUNT} reached`);
            return tx.vote.upsert({
                where: {stickerId_userId: {stickerId, userId: requesterId}},
                create: {stickerId, userId: requesterId, boardId},
                update: {count: {increment: 1}},
            });
        }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable}))
        this.boardEvents.boardChanged(boardId, socketId);
        return vote;
    }

    async removeVote(stickerId: string, requesterId: string, socketId?: string): Promise<Vote> {
        const boardId = await this.resolveBoardIdOrThrow(stickerId);
        await this.boardAccess.assertCanView(boardId, requesterId);

        const val = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
            const vote = await tx.vote.findUnique({
                where: {stickerId_userId: {stickerId, userId: requesterId}},
            });
            if (!vote) throw new NotFoundException('Vote not found');
            if (vote.count === 1) {
                return tx.vote.delete({where: {stickerId_userId: {stickerId, userId: requesterId}}});
            }
            return tx.vote.update({
                where: {stickerId_userId: {stickerId, userId: requesterId}},
                data: {count: {decrement: 1}},
            });
        }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable}))
        this.boardEvents.boardChanged(boardId, socketId);
        return val;
    }
}
