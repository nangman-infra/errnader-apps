import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { PublicUserProfile } from '../types/domain';

export function usePublicUserProfile(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['publicUserProfile', userId],
    queryFn: async () => {
      const { data } = await apiClient.get<PublicUserProfile>(`/users/${userId}`);
      return data;
    },
    enabled: !!userId && enabled,
    retry: false,
  });
}
