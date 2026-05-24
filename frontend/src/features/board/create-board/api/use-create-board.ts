import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardsQueryKey, type Board } from '@/entities/board';
import type { CreateBoardDto } from '../model';

export const useCreateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateBoardDto) =>
      apiClient<Board>('/boards', { method: 'POST', body: dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsQueryKey });
    },
  });
};
