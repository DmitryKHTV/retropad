import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';
import { ME_QUERY_KEY } from './keys';

function makeQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      // After silent refresh has already failed (see `apiClient`), any 401
      // surfacing through a query means the session is gone for good.
      // Drop the cached user here so AuthGate can redirect in the same
      // render cycle without waiting for /auth/me to refetch.
      onError: (error) => {
        if (error instanceof ApiError && error.isUnauthorized) {
          queryClient.setQueryData(ME_QUERY_KEY, null);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return queryClient;
}

let clientQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: new instance per request — prevents cross-request data leaks
    return makeQueryClient();
  }
  clientQueryClient ??= makeQueryClient();
  return clientQueryClient;
}
