import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {BoardRole} from "@prisma/client";

export type EffectiveRole = 'OWNER' | BoardRole;

@Injectable()
export class BoardAccessService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Resolves the requester's effective role on a board in a single query.
     * OWNER is synthesized from Board.ownerId — never stored in BoardMember.
     * Returns null if the user has no relation to the board at all.
     */
    async getRole(boardId: string, userId: string): Promise<EffectiveRole | null> {
        const board = await this.prisma.board.findUnique({
            where: {id: boardId},
            select: {
                ownerId: true,
                members: {where: {userId}, select: {role: true}},
            },
        });
        if (!board) {
            throw new NotFoundException(`Board with id ${boardId} not found`);
        }
        if (board.ownerId === userId) {
            return 'OWNER';
        }
        return board.members[0]?.role ?? null;
    }

    /** Any role may view. Returns the role so callers can expose it (e.g. myRole). */
    async assertCanView(boardId: string, userId: string): Promise<EffectiveRole> {
        const role = await this.getRole(boardId, userId);
        if (!role) {
            throw new ForbiddenException('You do not have access to this board');
        }
        return role;
    }

    /** OWNER and EDITOR may modify board content (columns, stickers). */
    async assertCanEdit(boardId: string, userId: string): Promise<EffectiveRole> {
        const role = await this.assertCanView(boardId, userId);
        if (role === BoardRole.VIEWER) {
            throw new ForbiddenException('You do not have permission to edit this board');
        }
        return role;
    }

    /** Only OWNER may manage the board itself (rename, delete, members). */
    async assertCanManage(boardId: string, userId: string): Promise<void> {
        const role = await this.assertCanView(boardId, userId);
        if (role !== 'OWNER') {
            throw new ForbiddenException('Only the board owner can perform this action');
        }
    }
}
