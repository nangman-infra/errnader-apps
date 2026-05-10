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
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      createInquiry({ title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}
