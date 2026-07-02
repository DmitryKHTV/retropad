import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {BoardRole, Prisma} from "@prisma/client";
import {BoardAccessService, type EffectiveRole} from "../board-access/board-access.service";
import {UsersService} from "../users/users.service";
import {AddMemberDto, UpdateMemberDto} from "./dto";

const memberSelect = {
    role: true,
    createdAt: true,
    user: {select: {id: true, email: true, name: true}},
} satisfies Prisma.BoardMemberSelect;

type MemberRow = Prisma.BoardMemberGetPayload<{select: typeof memberSelect}>;
export type MemberPayload = Omit<MemberRow, 'role'> & {role: EffectiveRole};

@Injectable()
export class MembersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly boardAccess: BoardAccessService,
        private readonly users: UsersService,
    ) {}

    // The owner is synthesized as the first entry — the members table stores only EDITOR/VIEWER,
    // so the frontend gets the full people list from a single endpoint.
    async findAll(boardId: string, requesterId: string): Promise<MemberPayload[]> {
        await this.boardAccess.assertCanView(boardId, requesterId);
        const board = await this.prisma.board.findUniqueOrThrow({
            where: {id: boardId},
            select: {
                createdAt: true,
                owner: {select: {id: true, email: true, name: true}},
                members: {select: memberSelect, orderBy: {createdAt: 'asc'}},
            },
        });
        return [
            {role: 'OWNER', createdAt: board.createdAt, user: board.owner},
            ...board.members,
        ];
    }

    async add(boardId: string, requesterId: string, dto: AddMemberDto): Promise<MemberPayload> {
        await this.boardAccess.assertCanManage(boardId, requesterId);
        const user = await this.users.findByEmail(dto.email);
        if (!user) {
            throw new NotFoundException('No user with this email');
        }
        // assertCanManage guarantees the requester is the owner
        if (user.id === requesterId) {
            throw new BadRequestException('The board owner is already a member');
        }
        try {
            return await this.prisma.boardMember.create({
                data: {boardId, userId: user.id, role: dto.role ?? BoardRole.EDITOR},
                select: memberSelect,
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('User is already a member of this board');
            }
            throw e;
        }
    }

    async updateRole(
        boardId: string,
        targetUserId: string,
        requesterId: string,
        dto: UpdateMemberDto,
    ): Promise<MemberPayload> {
        await this.boardAccess.assertCanManage(boardId, requesterId);
        try {
            return await this.prisma.boardMember.update({
                where: {boardId_userId: {boardId, userId: targetUserId}},
                data: {role: dto.role},
                select: memberSelect,
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new NotFoundException('User is not a member of this board');
            }
            throw e;
        }
    }

    // The owner may remove anyone; a member may remove themself (self-leave).
    async remove(boardId: string, targetUserId: string, requesterId: string): Promise<MemberPayload> {
        const isSelfLeave = targetUserId === requesterId;
        if (!isSelfLeave) {
            await this.boardAccess.assertCanManage(boardId, requesterId);
        }
        const targetRole = await this.boardAccess.getRole(boardId, targetUserId); // also 404s on a missing board
        if (targetRole === 'OWNER') {
            throw new ForbiddenException('The board owner cannot be removed');
        }
        if (!targetRole) {
            throw new NotFoundException('User is not a member of this board');
        }
        return this.prisma.boardMember.delete({
            where: {boardId_userId: {boardId, userId: targetUserId}},
            select: memberSelect,
        });
    }
}
