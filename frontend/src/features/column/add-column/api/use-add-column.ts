import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardQueryKey } from '@/entities/board';
import type { Column } from '@/entities/column';
import type { AddColumnDto } from '../model';

export const useAddColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: AddColumnDto) =>
            apiClient<Column>(`/columns`, {
                method: 'POST',
                body: dto,
            }),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        },
    });
};
