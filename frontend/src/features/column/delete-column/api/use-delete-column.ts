import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardQueryKey } from '@/entities/board';
import type { Column } from '@/entities/column';
import type { DeleteColumnDto } from '../model';

export const useDeleteColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, boardId: _ }: DeleteColumnDto) =>
            apiClient<Column>(`/columns/${id}`, { method: 'DELETE' }),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        },
    });
};
