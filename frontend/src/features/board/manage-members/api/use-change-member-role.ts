import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardMembersQueryKey, type BoardMember } from '@/entities/member';
import type { ChangeMemberRoleDto } from '../model';

export const useChangeMemberRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId, userId, role }: ChangeMemberRoleDto) =>
            apiClient<BoardMember>(`/boards/${boardId}/members/${userId}`, {
                method: 'PATCH',
                body: { role },
            }),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardMembersQueryKey(boardId) });
        },
    });
};
