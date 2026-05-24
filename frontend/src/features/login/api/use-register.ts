import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ME_QUERY_KEY, apiClient, type AuthResponse } from '@/shared/api';
import { RegisterDto } from '@/features/login/model/types';

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registerData: RegisterDto) =>
      apiClient<AuthResponse>('/auth/register', { method: 'POST', body: registerData }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });
};
