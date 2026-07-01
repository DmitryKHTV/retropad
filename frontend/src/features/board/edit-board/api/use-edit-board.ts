import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { Board, boardQueryKey } from '@/entities/board';
import type { EditBoardDto } from '../model';

export const useEditBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }: EditBoardDto) =>
            apiClient<Board>(`/boards/${id}`, {
                method: 'PATCH',
                body: data,
            }),
        onSettled: (_data, _err, { id }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(id) });
        },
    });
};
