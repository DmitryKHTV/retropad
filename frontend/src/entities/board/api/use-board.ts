import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { boardQueryKey } from '../model/keys';
import type { BoardWithColumns } from '../model/types';

export const boardQueryOptions = (id: string) =>
    queryOptions({
        queryKey: boardQueryKey(id),
        queryFn: ({ signal }) => apiClient<BoardWithColumns>(`/boards/${id}`, { signal }),
    });

export const useBoard = (id: string | undefined) =>
    useQuery({
        ...boardQueryOptions(id ?? ''),
        enabled: Boolean(id),
    });
