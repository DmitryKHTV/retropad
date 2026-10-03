import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ME_QUERY_KEY, apiClient, type AuthResponse } from '@/shared/api';

/**
 * Starts a demo session: the server creates a guest with a seeded board and
 * sets the auth cookies. Like login, it fills the `me` cache, and AuthGate
 * then moves the guest from /login to the boards list.
 */
export const useDemoLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient<AuthResponse>('/auth/demo', { method: 'POST' }),
    onSuccess: async ({ user }) => {
      await queryClient.cancelQueries({ queryKey: ME_QUERY_KEY });
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });
};
