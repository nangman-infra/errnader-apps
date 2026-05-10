export type BadgeType = 'popular' | 'fast_response' | 'top_rated' | 'new' | 'native_en';

export interface Errander {
  id: string;
  initial: string;
  name: string;
  avatarColor: string;
  badge?: BadgeType;
  specialty: string;
  rating: number;
  completedJobs: number;
  languages: string[];
  pricePerHour: number;
  city: string;
}
