import { useQueries, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { BadgeType, Errander } from '../types/domain';

interface ErranderApiResponse {
  id: string;
  name: string;
  initial: string;
  region: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  bio: string;
  completedCount: number;
  areas?: string[];
}

const AVATAR_COLORS = ['#F97316', '#EAB308', '#EF4444', '#059669', '#3B82F6', '#8B5CF6'];

function deriveAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function deriveBadge(completedCount: number, rating: number): BadgeType | undefined {
  if (completedCount >= 300) return 'top_rated';
  if (completedCount >= 150) return 'popular';
  if (completedCount < 50) return 'new';
  if (rating >= 4.9) return 'top_rated';
  return undefined;
}

function toErrander(errander: ErranderApiResponse): Errander {
  return {
    id: errander.id,
    name: errander.name,
    initial: errander.initial,
    avatarColor: deriveAvatarColor(errander.id),
    badge: deriveBadge(errander.completedCount, errander.rating),
    specialty: errander.categories[0] ?? errander.bio,
    rating: errander.rating,
    completedJobs: errander.completedCount,
    languages: ['KO'],
    pricePerHour: 0,
    city: errander.region,
    areas: errander.areas ?? [],
    isAvailable: errander.isAvailable,
  };
}

async function fetchErranders(areaId: string): Promise<Errander[]> {
  const params = areaId === '전체' ? {} : { area: areaId };
  const { data } = await apiClient.get<{ items: ErranderApiResponse[] }>('/erranders', { params });
  return data.items.map(toErrander);
}

export function useErranders(areaId: string) {
  return useQuery({
    queryKey: ['erranders', areaId],
    queryFn: () => fetchErranders(areaId),
  });
}

export function useErrandersByAreas(areaIds: string[]) {
  return useQueries({
    queries: areaIds.map((areaId) => ({
      queryKey: ['erranders', areaId],
      queryFn: () => fetchErranders(areaId),
      enabled: areaIds.length > 0,
    })),
    combine: (results) => {
      const erranderMap = new Map<string, Errander>();
      results.forEach((result) => {
        (result.data ?? []).forEach((errander) => {
          erranderMap.set(errander.id, errander);
        });
      });
      return {
        data: Array.from(erranderMap.values()),
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isError),
      };
    },
  });
}
