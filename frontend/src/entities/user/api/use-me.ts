import { queryOptions, useQuery } from '@tanstack/react-query';
import { ApiError, ME_QUERY_KEY, apiClient, type User } from '@/shared/api';

export const meQueryOptions = queryOptions({
  queryKey: ME_QUERY_KEY,
  queryFn: async ({ signal }): Promise<User | null> => {
    try {
      return await apiClient<User>('/auth/me', { signal });
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) return null;
      throw error;
    }
  },
  staleTime: 1000 * 60,
  retry: false,
});

export const useMe = () => useQuery(meQueryOptions);
