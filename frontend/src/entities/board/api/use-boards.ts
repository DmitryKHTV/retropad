import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardsQueryKey } from '../model/keys';
import type { BoardSummary } from '../model/types';

export const boardsQueryOptions = queryOptions({
  queryKey: boardsQueryKey,
  queryFn: ({ signal }) => apiClient<BoardSummary[]>('/boards', { signal }),
});

export const useBoards = () => useQuery(boardsQueryOptions);
