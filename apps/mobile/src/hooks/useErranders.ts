import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { BadgeType, Errander } from '../types/errander';

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
}

const AVATAR_COLORS = ['#F97316', '#EAB308', '#EF4444', '#059669', '#3B82F6', '#8B5CF6'];

function deriveAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function deriveBadge(completedCount: number, rating: number): BadgeType | undefined {
  if (completedCount >= 300) return 'top_rated';
  if (completedCount >= 150) return 'popular';
  if (completedCount < 50) return 'new';
  if (rating >= 4.9) return 'top_rated';
  return undefined;
}

function toErrander(e: ErranderApiResponse): Errander {
  return {
    id: e.id,
    name: e.name,
    initial: e.initial,
    avatarColor: deriveAvatarColor(e.id),
    badge: deriveBadge(e.completedCount, e.rating),
    specialty: e.categories[0] ?? e.bio,
    rating: e.rating,
    completedJobs: e.completedCount,
    languages: ['KO'],
    pricePerHour: 0,
    city: e.region,
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
