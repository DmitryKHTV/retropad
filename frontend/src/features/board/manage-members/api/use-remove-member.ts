import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardMembersQueryKey, type BoardMember } from '@/entities/member';
import type { RemoveMemberDto } from '../model';

export const useRemoveMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId, userId }: RemoveMemberDto) =>
            apiClient<BoardMember>(`/boards/${boardId}/members/${userId}`, {
                method: 'DELETE',
            }),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardMembersQueryKey(boardId) });
        },
    });
};
