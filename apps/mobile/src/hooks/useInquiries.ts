import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createInquiry, fetchInquiries } from '../api/inquiry';

export function useInquiries() {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const { data } = await fetchInquiries();
      return data.items;
    },
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, content, photoUrls }: { title: string; content: string; photoUrls?: string[] }) =>
      createInquiry({ title, content, photoUrls }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}
