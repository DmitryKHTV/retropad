import {useMutation, useQueryClient} from "@tanstack/react-query";
import {apiClient} from "@/shared/api";
import {boardsQueryKey} from "@/entities/board";
import {DeleteBoardDto} from "@/features/board/delete-board/model";

export const useDeleteBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: DeleteBoardDto) =>
            apiClient(`/boards/${dto.id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: boardsQueryKey });
        },
    });
}