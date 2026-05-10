export type UserRole = 'traveler' | 'errander';

export interface UserProfile {
  id: string;
  initial: string;
  name: string;
  email: string;
  joinedAt: string;
  activeCount: number;
  completedCount: number;
  totalSpentLabel: string;
  paymentMethod: string;
  language: string;
  role: UserRole;
  avatarUrl?: string;
  areas?: string[];
}
