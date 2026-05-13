import { ErrandStatus } from '../types/domain';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '/api' : 'https://bj9l28xy18.execute-api.ap-northeast-2.amazonaws.com/dev');

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ?? 'wss://6i2cs7w9vk.execute-api.ap-northeast-2.amazonaws.com/dev';

export const REQUEST_TIMEOUT_MS = 10_000;

export const CITIES = [
  {
    id: 'seoul',
    nameKey: 'areas.seoul',
    areas: [
      { id: 'seoul_station', name: '서울역', nameKey: 'areas.seoulStation' },
      { id: 'hongdae', name: '홍대', nameKey: 'areas.hongdae' },
      { id: 'hapjeong', name: '합정', nameKey: 'areas.hapjeong' },
      { id: 'itaewon', name: '이태원', nameKey: 'areas.itaewon' },
      { id: 'myeongdong', name: '명동', nameKey: 'areas.myeongdong' },
      { id: 'dongdaemun', name: '동대문', nameKey: 'areas.dongdaemun' },
      { id: 'seongsu', name: '성수', nameKey: 'areas.seongsu' },
      { id: 'konkuk', name: '건대', nameKey: 'areas.konkuk' },
      { id: 'jongno', name: '종로', nameKey: 'areas.jongno' },
      { id: 'gyeongbokgung', name: '경복궁', nameKey: 'areas.gyeongbokgung' },
      { id: 'gwanghwamun', name: '광화문', nameKey: 'areas.gwanghwamun' },
      { id: 'ichon', name: '이촌', nameKey: 'areas.ichon' },
      { id: 'yeouido', name: '여의도', nameKey: 'areas.yeouido' },
      { id: 'incheon_airport', name: '인천공항', nameKey: 'areas.incheonAirport' },
      { id: 'gimpo_airport', name: '김포공항', nameKey: 'areas.gimpoAirport' },
    ],
  },
] as const;

export const ALL_AREAS = CITIES.flatMap((city) => city.areas);

export const CATEGORY_FILTERS = [
  { labelKey: 'category.all', value: undefined },
  { labelKey: 'category.reservation', value: '예약 대행' },
  { labelKey: 'category.airportPickup', value: '공항 픽업' },
  { labelKey: 'category.navigation', value: '길찾기' },
  { labelKey: 'category.other', value: '기타' },
] as const;

export const STATUS_FILTERS: { labelKey: string; value: ErrandStatus | undefined }[] = [
  { labelKey: 'status.all', value: undefined },
  { labelKey: 'status.pending', value: 'PENDING' },
  { labelKey: 'status.confirmed', value: 'CONFIRMED' },
  { labelKey: 'status.completed', value: 'COMPLETED' },
  { labelKey: 'status.cancelled', value: 'CANCELLED' },
];

export const STATUS_CONFIG: Record<ErrandStatus, { labelKey: string; color: string; bg: string }> = {
  PENDING: { labelKey: 'status.pending', color: '#D97706', bg: '#FEF3C7' },
  CONFIRMED: { labelKey: 'status.confirmed', color: '#2563EB', bg: '#EFF6FF' },
  ACCEPTED: { labelKey: 'status.confirmed', color: '#2563EB', bg: '#EFF6FF' },
  COMPLETED: { labelKey: 'status.completed', color: '#059669', bg: '#D1FAE5' },
  CANCELLED: { labelKey: 'status.cancelled', color: '#6B7280', bg: '#F3F4F6' },
};

export const SERVICE_ITEMS = [
  { id: 'reservation', label: '예약 대행', labelKey: 'services.reservation', href: '/errands/new?what=예약%20대행', icon: 'Calendar' },
  { id: 'airport_pickup', label: '공항 픽업', labelKey: 'services.airportPickup', href: '/errands/new?what=공항%20픽업', icon: 'Plane' },
  { id: 'navigation', label: '길찾기', labelKey: 'services.navigation', href: '/errands/new?what=길찾기', icon: 'Navigation' },
  { id: 'other', label: '기타', labelKey: 'services.other', href: '/errands/new?what=기타', icon: 'Grid' },
];

export const MAX_HOME_CARDS = 5;
