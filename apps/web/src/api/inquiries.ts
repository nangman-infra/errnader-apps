import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { Inquiry } from '../types/domain';

async function fetchInquiries(): Promise<Inquiry[]> {
  const { data } = await apiClient.get<{ items: Inquiry[] }>('/inquiries');
  return data.items;
}

async function createInquiry(payload: { title: string; content: string; photoUrls?: string[] }) {
  return apiClient.post('/inquiries', payload);
}

export function useInquiries() {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: fetchInquiries,
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}
