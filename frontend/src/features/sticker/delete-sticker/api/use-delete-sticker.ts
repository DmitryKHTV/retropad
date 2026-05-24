import {useMutation, useQueryClient} from "@tanstack/react-query";
import {apiClient} from "@/shared/api";
import {Sticker} from "@/entities/sticker";
import {boardQueryKey} from "@/entities/board";
import {DeleteStickerDto} from "@/features/sticker/delete-sticker/model";

export const useDeleteSticker = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, boardId: _}: DeleteStickerDto) => apiClient<Sticker>(`/stickers/${id}`, {method: 'DELETE'}),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        },
    })
}