import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardMembersQueryKey, type BoardMember } from '@/entities/member';
import type { AddMemberDto } from '../model';

export const useAddMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId, ...dto }: AddMemberDto) =>
            apiClient<BoardMember>(`/boards/${boardId}/members`, {
                method: 'POST',
                body: dto,
            }),
        onSuccess: (_data, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardMembersQueryKey(boardId) });
        },
    });
};
