import {ForbiddenException, NotFoundException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {BoardAccessService, EffectiveRole} from "./board-access.service";
import {PrismaService} from "../prisma/prisma.service";

const BOARD_ID = 'board-1';
const OWNER_ID = 'owner-1';
const USER_ID = 'user-1';
const OTHER_ID = 'user-2';

describe('BoardAccessService', () => {
    let service: BoardAccessService;
    const prisma = {board: {findUnique: jest.fn()}};

    // Shapes the row getRole reads: the owner plus at most one membership of the requester.
    const boardWhereUserIs = (role: EffectiveRole | null) => {
        if (role === 'OWNER') return {ownerId: USER_ID, members: []};
        return {ownerId: OWNER_ID, members: role ? [{role}] : []};
    };

    beforeEach(async () => {
        jest.resetAllMocks();
        const module = await Test.createTestingModule({
            providers: [BoardAccessService, {provide: PrismaService, useValue: prisma}],
        }).compile();
        service = module.get(BoardAccessService);
    });

    describe('getRole', () => {
        it('throws 404 when the board does not exist', async () => {
            prisma.board.findUnique.mockResolvedValue(null);
            await expect(service.getRole(BOARD_ID, USER_ID)).rejects.toThrow(NotFoundException);
        });

        it.each<EffectiveRole | null>(['OWNER', 'EDITOR', 'VIEWER', null])('resolves %s', async (role) => {
            prisma.board.findUnique.mockResolvedValue(boardWhereUserIs(role));
            await expect(service.getRole(BOARD_ID, USER_ID)).resolves.toBe(role);
        });

        it('filters memberships by the requester in the same query', async () => {
            prisma.board.findUnique.mockResolvedValue(boardWhereUserIs('EDITOR'));
            await service.getRole(BOARD_ID, USER_ID);
            expect(prisma.board.findUnique).toHaveBeenCalledTimes(1);
            expect(prisma.board.findUnique).toHaveBeenCalledWith({
                where: {id: BOARD_ID},
                select: {ownerId: true, members: {where: {userId: USER_ID}, select: {role: true}}},
            });
        });
    });

    describe.each<[string, (s: BoardAccessService) => Promise<unknown>, EffectiveRole[]]>([
        ['assertCanView', (s) => s.assertCanView(BOARD_ID, USER_ID), ['OWNER', 'EDITOR', 'VIEWER']],
        ['assertCanEdit', (s) => s.assertCanEdit(BOARD_ID, USER_ID), ['OWNER', 'EDITOR']],
        ['assertCanManage', (s) => s.assertCanManage(BOARD_ID, USER_ID), ['OWNER']],
    ])('%s', (_name, assert, allowed) => {
        it.each<EffectiveRole | null>(['OWNER', 'EDITOR', 'VIEWER', null])('role %s', async (role) => {
            prisma.board.findUnique.mockResolvedValue(boardWhereUserIs(role));
            if (role && allowed.includes(role)) {
                await assert(service);
            } else {
                await expect(assert(service)).rejects.toThrow(ForbiddenException);
            }
        });
    });

    it.each(['OWNER', 'EDITOR'] as const)('assertCanView and assertCanEdit return the role (%s)', async (role) => {
        prisma.board.findUnique.mockResolvedValue(boardWhereUserIs(role));
        await expect(service.assertCanView(BOARD_ID, USER_ID)).resolves.toBe(role);
        await expect(service.assertCanEdit(BOARD_ID, USER_ID)).resolves.toBe(role);
    });

    describe('assertCanTouchSticker', () => {
        it.each<[EffectiveRole, string, boolean]>([
            ['OWNER', USER_ID, true],
            ['OWNER', OTHER_ID, true],
            ['EDITOR', USER_ID, true],
            ['EDITOR', OTHER_ID, false],
            ['VIEWER', USER_ID, false],
        ])('%s touching a sticker by %s → allowed: %s', async (role, authorId, allowed) => {
            prisma.board.findUnique.mockResolvedValue(boardWhereUserIs(role));
            const call = service.assertCanTouchSticker(BOARD_ID, USER_ID, authorId);
            if (allowed) {
                await expect(call).resolves.toBeUndefined();
            } else {
                await expect(call).rejects.toThrow(ForbiddenException);
            }
        });
    });
});
