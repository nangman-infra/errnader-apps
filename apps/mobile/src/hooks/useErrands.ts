import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Errand, ErrandStatus } from '../types/errand';

interface FetchErrandsOptions {
  mine?: boolean;
  category?: string;
  status?: ErrandStatus;
}

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
  return useErrands({ mine: true, status });
}

export function useErrand(errandId: string) {
  return useQuery({
    queryKey: ['errand', errandId],
    queryFn: async () => {
      const { data } = await apiClient.get<Errand>(`/errands/${errandId}`);
      return data;
    },
    enabled: !!errandId,
  });
}
