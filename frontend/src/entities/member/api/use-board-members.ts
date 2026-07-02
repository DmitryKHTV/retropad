import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardMembersQueryKey } from '../model/keys';
import type { BoardMember } from '../model/types';

export const boardMembersQueryOptions = (boardId: string) =>
    queryOptions({
        queryKey: boardMembersQueryKey(boardId),
        queryFn: ({ signal }) => apiClient<BoardMember[]>(`/boards/${boardId}/members`, { signal }),
    });

export const useBoardMembers = (boardId: string, enabled = true) =>
    useQuery({
        ...boardMembersQueryOptions(boardId),
        enabled,
    });
