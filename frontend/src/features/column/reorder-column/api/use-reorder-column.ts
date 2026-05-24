import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardQueryKey, type BoardWithColumns } from '@/entities/board';
import type { Column } from '@/entities/column';
import type { ReorderColumnDto } from '../model';

export const useReorderColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ columnId, newOrder }: ReorderColumnDto) =>
            apiClient<Column>(`/columns/${columnId}`, {
                method: 'PATCH',
                body: { order: newOrder },
            }),

        onMutate: async ({ boardId, columnId, newOrder }) => {
            const key = boardQueryKey(boardId);
            await queryClient.cancelQueries({ queryKey: key });

            const previous = queryClient.getQueryData<BoardWithColumns>(key);
            if (!previous) return { previous };

            const oldIndex = previous.columns.findIndex((c) => c.id === columnId);
            if (oldIndex === -1) return { previous };

            const next = [...previous.columns];
            const [moved] = next.splice(oldIndex, 1);
            next.splice(newOrder, 0, moved);

            const reindexed = next.map((c, i) => ({ ...c, order: i }));

            queryClient.setQueryData<BoardWithColumns>(key, {
                ...previous,
                columns: reindexed,
            });

            return { previous };
        },

        onError: (_err, { boardId }, context) => {
            if (context?.previous) {
                queryClient.setQueryData(boardQueryKey(boardId), context.previous);
            }
        },

        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        },
    });
};
