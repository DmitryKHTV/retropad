import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardQueryKey, boardsQueryKey } from '@/entities/board';
import type { BoardMember } from '@/entities/member';
import type { RemoveMemberDto } from '../model';

// Same endpoint as useRemoveMember, different cache semantics: after leaving,
// the board is inaccessible — drop its queries instead of refetching into a 403.
export const useLeaveBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId, userId }: RemoveMemberDto) =>
            apiClient<BoardMember>(`/boards/${boardId}/members/${userId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_data, { boardId }) => {
            queryClient.removeQueries({ queryKey: boardQueryKey(boardId) });
            queryClient.invalidateQueries({ queryKey: boardsQueryKey });
        },
    });
};
