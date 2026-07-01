import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardQueryKey } from '@/entities/board';
import type { Column } from '@/entities/column';
import type { EditColumnDto } from '../model';

export const useEditColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId: _, id, ...data }: EditColumnDto) =>
            apiClient<Column>(`/columns/${id}`, {
                method: 'PATCH',
                body: data,
            }),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        },
    });
};
