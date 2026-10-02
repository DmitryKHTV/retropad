import {ConflictException, ForbiddenException, NotFoundException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {Prisma} from "@prisma/client";
import {VotesService} from "./votes.service";
import {PrismaService} from "../prisma/prisma.service";
import {BoardAccessService} from "../board-access/board-access.service";
import {BoardEventsService} from "../realtime/board-events.service";
import {MAX_VOTES_COUNT, SERIALIZATION_MAX_ATTEMPTS} from "./votes.constants";

const BOARD_ID = 'board-1';
const STICKER_ID = 'sticker-1';
const USER_ID = 'user-1';
const SOCKET_ID = 'socket-1';
const VOTE_KEY = {stickerId_userId: {stickerId: STICKER_ID, userId: USER_ID}};

const serializationFailure = () =>
    new Prisma.PrismaClientKnownRequestError('could not serialize access', {code: 'P2034', clientVersion: 'test'});

// The shape @prisma/adapter-pg throws when Postgres rejects the COMMIT itself.
const commitSerializationFailure = () =>
    Object.assign(new Error('TransactionWriteConflict'), {
        name: 'DriverAdapterError',
        cause: {kind: 'TransactionWriteConflict', originalCode: '40001'},
    });

describe('VotesService', () => {
    let service: VotesService;

    const tx = {
        vote: {aggregate: jest.fn(), upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn()},
    };
    const prisma = {sticker: {findUnique: jest.fn()}, $transaction: jest.fn()};
    const boardAccess = {assertCanView: jest.fn()};
    const boardEvents = {boardChanged: jest.fn()};

    // The real interactive transaction hands the callback a client bound to one connection.
    const runCallbackWithTx = () =>
        prisma.$transaction.mockImplementation((work: (client: typeof tx) => Promise<unknown>) => work(tx));

    const spent = (count: number | null) => tx.vote.aggregate.mockResolvedValue({_sum: {count}});

    beforeEach(async () => {
        jest.resetAllMocks();
        prisma.sticker.findUnique.mockResolvedValue({column: {boardId: BOARD_ID}});
        boardAccess.assertCanView.mockResolvedValue('VIEWER');
        runCallbackWithTx();

        const module = await Test.createTestingModule({
            providers: [
                VotesService,
                {provide: PrismaService, useValue: prisma},
                {provide: BoardAccessService, useValue: boardAccess},
                {provide: BoardEventsService, useValue: boardEvents},
            ],
        }).compile();
        service = module.get(VotesService);
        // No real waiting between retries. Stubbed after compile: Nest itself calls
        // Math.random for internal ids, and a constant value breaks provider lookup.
        jest.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => jest.restoreAllMocks());

    describe('addVote', () => {
        it('throws 404 for a missing sticker before checking access', async () => {
            prisma.sticker.findUnique.mockResolvedValue(null);
            await expect(service.addVote(STICKER_ID, USER_ID)).rejects.toThrow(NotFoundException);
            expect(boardAccess.assertCanView).not.toHaveBeenCalled();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('checks view access on the board the sticker belongs to', async () => {
            boardAccess.assertCanView.mockRejectedValue(new ForbiddenException());
            await expect(service.addVote(STICKER_ID, USER_ID)).rejects.toThrow(ForbiddenException);
            expect(boardAccess.assertCanView).toHaveBeenCalledWith(BOARD_ID, USER_ID);
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('adds a dot inside a Serializable transaction and rings the board bell', async () => {
            spent(MAX_VOTES_COUNT - 1);
            const vote = {stickerId: STICKER_ID, userId: USER_ID, boardId: BOARD_ID, count: 1};
            tx.vote.upsert.mockResolvedValue(vote);

            await expect(service.addVote(STICKER_ID, USER_ID, SOCKET_ID)).resolves.toBe(vote);

            expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
            expect(tx.vote.aggregate).toHaveBeenCalledWith({
                _sum: {count: true},
                where: {userId: USER_ID, boardId: BOARD_ID},
            });
            expect(tx.vote.upsert).toHaveBeenCalledWith({
                where: VOTE_KEY,
                create: {stickerId: STICKER_ID, userId: USER_ID, boardId: BOARD_ID},
                update: {count: {increment: 1}},
            });
            expect(boardEvents.boardChanged).toHaveBeenCalledWith(BOARD_ID, SOCKET_ID);
        });

        it('treats a user with no votes on the board as having spent nothing', async () => {
            spent(null);
            await service.addVote(STICKER_ID, USER_ID);
            expect(tx.vote.upsert).toHaveBeenCalled();
        });

        it('rejects with 403 once the budget is spent, without writing or notifying', async () => {
            spent(MAX_VOTES_COUNT);
            await expect(service.addVote(STICKER_ID, USER_ID)).rejects.toThrow(ForbiddenException);
            expect(tx.vote.upsert).not.toHaveBeenCalled();
            expect(boardEvents.boardChanged).not.toHaveBeenCalled();
        });

        it('replays the transaction after a serialization failure', async () => {
            spent(0);
            tx.vote.upsert.mockResolvedValue({count: 1});
            prisma.$transaction.mockRejectedValueOnce(serializationFailure());

            await expect(service.addVote(STICKER_ID, USER_ID)).resolves.toEqual({count: 1});
            expect(prisma.$transaction).toHaveBeenCalledTimes(2);
            expect(boardEvents.boardChanged).toHaveBeenCalledTimes(1);
        });

        it('replays the transaction after a serialization failure on COMMIT', async () => {
            spent(0);
            tx.vote.upsert.mockResolvedValue({count: 1});
            prisma.$transaction.mockRejectedValueOnce(commitSerializationFailure());

            await expect(service.addVote(STICKER_ID, USER_ID)).resolves.toEqual({count: 1});
            expect(prisma.$transaction).toHaveBeenCalledTimes(2);
        });

        it('answers 409 when serialization failures persist', async () => {
            prisma.$transaction.mockRejectedValue(serializationFailure());

            await expect(service.addVote(STICKER_ID, USER_ID)).rejects.toThrow(ConflictException);
            expect(prisma.$transaction).toHaveBeenCalledTimes(SERIALIZATION_MAX_ATTEMPTS);
            expect(boardEvents.boardChanged).not.toHaveBeenCalled();
        });

        it('does not retry other errors', async () => {
            const failure = new Error('connection lost');
            prisma.$transaction.mockRejectedValue(failure);

            await expect(service.addVote(STICKER_ID, USER_ID)).rejects.toBe(failure);
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });
    });

    describe('removeVote', () => {
        it('throws 404 when the user has no vote on the sticker', async () => {
            tx.vote.findUnique.mockResolvedValue(null);
            await expect(service.removeVote(STICKER_ID, USER_ID)).rejects.toThrow(NotFoundException);
            expect(tx.vote.update).not.toHaveBeenCalled();
            expect(tx.vote.delete).not.toHaveBeenCalled();
            expect(boardEvents.boardChanged).not.toHaveBeenCalled();
        });

        it('deletes the row when removing the last dot', async () => {
            tx.vote.findUnique.mockResolvedValue({count: 1});
            await service.removeVote(STICKER_ID, USER_ID, SOCKET_ID);
            expect(tx.vote.delete).toHaveBeenCalledWith({where: VOTE_KEY});
            expect(tx.vote.update).not.toHaveBeenCalled();
            expect(boardEvents.boardChanged).toHaveBeenCalledWith(BOARD_ID, SOCKET_ID);
        });

        it('decrements the count when more than one dot is left', async () => {
            tx.vote.findUnique.mockResolvedValue({count: 3});
            await service.removeVote(STICKER_ID, USER_ID);
            expect(tx.vote.update).toHaveBeenCalledWith({where: VOTE_KEY, data: {count: {decrement: 1}}});
            expect(tx.vote.delete).not.toHaveBeenCalled();
        });

        it('replays the transaction after a serialization failure', async () => {
            tx.vote.findUnique.mockResolvedValue({count: 2});
            prisma.$transaction.mockRejectedValueOnce(serializationFailure());
            await service.removeVote(STICKER_ID, USER_ID);
            expect(prisma.$transaction).toHaveBeenCalledTimes(2);
        });
    });
});
