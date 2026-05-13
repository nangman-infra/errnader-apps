import { UserProfile } from '../types/domain';

export function isProfileComplete(profile: Partial<UserProfile> | null | undefined): boolean {
  const hasName = typeof profile?.name === 'string' && profile.name.trim().length > 0;
  const hasRole = profile?.role === 'traveler' || profile?.role === 'errander';
  return hasName && hasRole;
}
