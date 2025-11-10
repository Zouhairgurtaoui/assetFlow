import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { UpdateUserData } from '@/types/user';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

export const useUsers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: () => usersApi.getUsers(),
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
};

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      usersApi.updateUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(variables.id) });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  return {
    updateUser,
    deleteUser,
  };
};
