import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { Errand, ErrandStatus } from '../types/domain';

interface FetchErrandsOptions {
  mine?: boolean;
  category?: string;
  status?: ErrandStatus;
}

const ALL_ERRAND_STATUSES: ErrandStatus[] = ['PENDING', 'CONFIRMED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

async function fetchErrands(opts: FetchErrandsOptions): Promise<Errand[]> {
  const params: Record<string, string> = {};
  if (opts.mine) params.mine = 'true';
  if (opts.category) params.category = opts.category;
  if (opts.status) params.status = opts.status;
  const { data } = await apiClient.get<{ items: Errand[] }>('/errands', { params });
  return data.items;
}

export function useErrands(opts: FetchErrandsOptions = {}) {
  return useQuery({
    queryKey: ['errands', opts],
    queryFn: () => fetchErrands(opts),
  });
}

export function useMyErrands(status?: ErrandStatus) {
  return useQuery({
    queryKey: ['errands', { mine: true, status }],
    queryFn: async () => {
      if (status) {
        return fetchErrands({ mine: true, status });
      }
      const results = await Promise.all(
        ALL_ERRAND_STATUSES.map((s) => fetchErrands({ mine: true, status: s })),
      );
      return results.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });
}

export function useErrand(errandId: string | undefined) {
  return useQuery({
    queryKey: ['errand', errandId],
    queryFn: async () => {
      const { data } = await apiClient.get<Errand>(`/errands/${errandId}`);
      return data;
    },
    enabled: !!errandId,
  });
}
