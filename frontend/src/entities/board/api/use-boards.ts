import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardsQueryKey } from '../model/keys';
import type { Board } from '../model/types';

export const boardsQueryOptions = queryOptions({
  queryKey: boardsQueryKey,
  queryFn: ({ signal }) => apiClient<Board[]>('/boards', { signal }),
});

export const useBoards = () => useQuery(boardsQueryOptions);
