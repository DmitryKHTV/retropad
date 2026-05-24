import {useMutation, useQueryClient} from "@tanstack/react-query";
import {apiClient} from "@/shared/api";
import type {AddStickerDto} from "@/features/sticker/add-sticker/model";
import {Sticker} from "@/entities/sticker";
import {boardQueryKey} from "@/entities/board";

export const useAddSticker = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({boardId: _, ...dto}: AddStickerDto) => apiClient<Sticker>(`/stickers`, {method: 'POST', body: dto}),
        onSettled: (_data, _err, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        },
    })
}