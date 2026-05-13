import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { UserProfile } from '../types/domain';

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/me');
  return data;
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: fetchMyProfile,
    retry: 1,
  });
}
