import { hashKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { ME_QUERY_KEY, apiClient } from '@/shared/api';

const ME_QUERY_HASH = hashKey(ME_QUERY_KEY);

/**
 * Logs out and flips the local state to logged-out even if the server call
 * fails (e.g. the session already expired), hence onSettled.
 *
 * `me` is overwritten with null rather than removed: AuthGate, Navbar and
 * LogoutButton stay subscribed to that query, and a removed query would keep
 * showing them the previous user. Every other query was fetched with the
 * previous user's cookies, so those are dropped to avoid leaking data into
 * the next session.
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryHash !== ME_QUERY_HASH,
      });
    },
  });
};
