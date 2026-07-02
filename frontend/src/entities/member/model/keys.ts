import {boardQueryKey} from "@/entities/board";

export const boardMembersQueryKey = (boardId: string) =>
    [...boardQueryKey(boardId), 'members'] as const;
