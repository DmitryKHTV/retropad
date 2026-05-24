import { queryOptions, useQuery } from '@tanstack/react-query';
import { ApiError, ME_QUERY_KEY, apiClient, type User } from '@/shared/api';

// Exported as queryOptions so it can also be prefetched on the server
// (e.g. queryClient.prefetchQuery(meQueryOptions)) without duplicating config.
export const meQueryOptions = queryOptions({
  queryKey: ME_QUERY_KEY,
  queryFn: async ({ signal }): Promise<User | null> => {
    try {
      return await apiClient<User>('/auth/me', { signal });
    } catch (error) {
      // 401 = anonymous, not a failure. Returning null keeps consumers free
      // of error/empty/loading branching for the common "not logged in" case.
      if (error instanceof ApiError && error.isUnauthorized) return null;
      throw error;
    }
  },
  staleTime: 1000 * 60,
  retry: false,
});

export const useMe = () => useQuery(meQueryOptions);
