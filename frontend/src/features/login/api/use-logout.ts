import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ME_QUERY_KEY, apiClient } from '@/shared/api';

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient('/auth/logout', { method: 'POST' }),
    // onSettled, not onSuccess: even if the server call fails (e.g. session
    // already expired) we still want the local state to flip to logged-out.
    onSettled: () => {
      // Drop everything: any other cached query was scoped to the previous
      // user's cookies and would either 401 or leak data after re-login.
      queryClient.clear();
      queryClient.setQueryData(ME_QUERY_KEY, null);
    },
  });
};
