import {useMutation, useQueryClient} from "@tanstack/react-query";
import {apiClient} from "@/shared/api";
import {Sticker} from "@/entities/sticker";
import {boardQueryKey} from "@/entities/board";
import {EditStickerDto} from "@/features/sticker/edit-sticker/model";

export const useEditSticker = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, boardId: _, ...dto}: EditStickerDto) => apiClient<Sticker>(`/stickers/${id}`, {method: 'PATCH', body: dto}),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        },
    })
}