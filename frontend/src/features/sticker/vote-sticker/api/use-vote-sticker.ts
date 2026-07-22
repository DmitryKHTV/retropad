import {useMutation, useQueryClient} from "@tanstack/react-query";
import {apiClient} from "@/shared/api";
import {boardQueryKey} from "@/entities/board";
import type {VoteStickerDto} from "../model";

// Add one dot. The server returns the Vote row, but we don't consume it — like
// the other sticker mutations, we invalidate the board query and refetch the
// aggregates (WS rings the other participants). No optimistic update yet.
export const useVoteSticker = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({stickerId}: VoteStickerDto) =>
            apiClient<unknown>(`/stickers/${stickerId}/votes`, {method: 'POST'}),
        onSettled: (_data, _err, {boardId}) => {
            queryClient.invalidateQueries({queryKey: boardQueryKey(boardId)});
        },
    });
};

// Remove one of your own dots (server deletes the row at count 1).
export const useUnvoteSticker = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({stickerId}: VoteStickerDto) =>
            apiClient<unknown>(`/stickers/${stickerId}/votes`, {method: 'DELETE'}),
        onSettled: (_data, _err, {boardId}) => {
            queryClient.invalidateQueries({queryKey: boardQueryKey(boardId)});
        },
    });
};
