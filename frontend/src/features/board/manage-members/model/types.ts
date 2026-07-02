import type {BoardRole} from "@/shared/api";

export interface AddMemberDto {
    boardId: string;
    email: string;
    role?: BoardRole;
}

export interface ChangeMemberRoleDto {
    boardId: string;
    userId: string;
    role: BoardRole;
}

export interface RemoveMemberDto {
    boardId: string;
    userId: string;
}
