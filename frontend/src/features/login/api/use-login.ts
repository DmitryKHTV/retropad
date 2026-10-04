import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ME_QUERY_KEY, apiClient, type AuthResponse } from '@/shared/api';
import { LoginDto } from '@/features/login/model/types';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: (loginData: LoginDto) =>
      apiClient<AuthResponse>('/auth/login', { method: 'POST', body: loginData }),
    onSuccess: async ({ user }) => {
      await queryClient.cancelQueries({ queryKey: ME_QUERY_KEY });
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });
};
