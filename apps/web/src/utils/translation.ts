export function getCategoryKey(category: string): string | null {
  const map: Record<string, string> = {
    '예약 대행': 'category.reservation',
    Reservation: 'category.reservation',
    '공항 픽업': 'category.airportPickup',
    'Airport Pickup': 'category.airportPickup',
    길찾기: 'category.navigation',
    Navigation: 'category.navigation',
    기타: 'category.other',
    Other: 'category.other',
  };
  return map[category] ?? null;
}
