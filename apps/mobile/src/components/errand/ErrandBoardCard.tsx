import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Errand } from '../../types/errand';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_CONFIG: Record<string, { icon: IoniconName; color: string; bg: string }> = {
  '예약 대행':    { icon: 'calendar',  color: '#EF4444', bg: '#FEE2E2' },
  '공항 픽업':    { icon: 'airplane',  color: '#F97316', bg: '#FFEDD5' },
  '길찾기':       { icon: 'navigate',  color: '#F59E0B', bg: '#FEF3C7' },
  'Reservation':  { icon: 'calendar',  color: '#EF4444', bg: '#FEE2E2' },
  'Airport Pickup': { icon: 'airplane', color: '#F97316', bg: '#FFEDD5' },
  'Navigation':   { icon: 'navigate',  color: '#F59E0B', bg: '#FEF3C7' },
};
const DEFAULT_CATEGORY = { icon: 'apps' as IoniconName, color: '#6B7280', bg: '#F3F4F6' };

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

interface ErrandBoardCardProps {
  errand: Errand;
  onPress?: () => void;
}

export function ErrandBoardCard({ errand, onPress }: ErrandBoardCardProps) {
  const cat = CATEGORY_CONFIG[errand.category] ?? DEFAULT_CATEGORY;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* 상단: 카테고리 아이콘 + 제목 + 시간 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={cat.icon} size={22} color={cat.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
            {errand.title}
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{errand.category}</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{timeAgo(errand.createdAt)}</Text>
      </View>

      {/* 하단: 언제, 어디서 */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={13} color="#9CA3AF" />
          <Text style={{ fontSize: 13, color: '#6B7280' }}>{errand.when}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text style={{ fontSize: 13, color: '#6B7280' }} numberOfLines={1}>{errand.where}</Text>
        </View>
      </View>

      {/* 상세 내용 (있을 때만) */}
      {errand.detail ? (
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 10, lineHeight: 20 }} numberOfLines={2}>
          {errand.detail}
        </Text>
      ) : null}

      {/* 상세정보 버튼 */}
      <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{ paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Ionicons name="document-text-outline" size={13} color="#F97316" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>상세정보</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
