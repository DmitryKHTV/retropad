import { MutationCache, QueryCache, QueryClient, type MutationMeta } from '@tanstack/react-query';
import { describeApiError } from '@/shared/lib/describe-api-error';
import { toast } from '@/shared/lib/toast';
import { ApiError } from './api-error';
import { ME_QUERY_KEY } from './keys';

/**
 * Typed `meta` for every mutation. `suppressErrorToast` is for mutations whose
 * UI already shows the error inline (forms), so it is not reported twice.
 */
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      suppressErrorToast?: boolean;
    };
  }
}

/**
 * Every failed mutation becomes a toast, unless it opted out through `meta`.
 * A 401 is skipped: the silent refresh has already failed by then, and
 * AuthGate is about to redirect to /login.
 */
const toastMutationError = (error: Error, meta: MutationMeta | undefined) => {
  if (meta?.suppressErrorToast) return;
  if (error instanceof ApiError && error.isUnauthorized) return;
  toast.error(describeApiError(error));
};

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
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        toastMutationError(error, mutation.meta),
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
