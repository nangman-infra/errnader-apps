import { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMyErrands } from '../../hooks/useErrands';
import { useMyProfile } from '../../hooks/useMyProfile';
import { Errand, ErrandStatus } from '../../types/errand';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_FILTERS: { label: string; value: ErrandStatus | undefined }[] = [
  { label: '전체', value: undefined },
  { label: '대기중', value: 'PENDING' },
  { label: '진행중', value: 'ACCEPTED' },
  { label: '완료', value: 'COMPLETED' },
  { label: '취소', value: 'CANCELLED' },
];

const STATUS_CONFIG: Record<ErrandStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: '대기중', color: '#D97706', bg: '#FEF3C7' },
  ACCEPTED:  { label: '진행중', color: '#2563EB', bg: '#EFF6FF' },
  COMPLETED: { label: '완료',   color: '#059669', bg: '#D1FAE5' },
  CANCELLED: { label: '취소',   color: '#6B7280', bg: '#F3F4F6' },
};

const CATEGORY_ICON: Record<string, IoniconName> = {
  '예약 대행': 'calendar',
  '공항 픽업': 'airplane',
  '길찾기':    'navigate',
  'Reservation': 'calendar',
  'Airport Pickup': 'airplane',
  'Navigation': 'navigate',
};

function ErrandCard({ errand }: { errand: Errand }) {
  const st = STATUS_CONFIG[errand.status as ErrandStatus] ?? STATUS_CONFIG.PENDING;
  const icon = CATEGORY_ICON[errand.category] ?? 'apps-outline';

  return (
    <View
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
      {/* 상단: 카테고리 + 제목 + 상태 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={20} color="#F97316" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
            {errand.title}
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{errand.category}</Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: st.bg }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: st.color }}>{st.label}</Text>
        </View>
      </View>

      {/* 언제 / 어디서 */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: errand.detail ? 10 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={13} color="#9CA3AF" />
          <Text style={{ fontSize: 13, color: '#6B7280' }}>{errand.when}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text style={{ fontSize: 13, color: '#6B7280' }} numberOfLines={1}>{errand.where}</Text>
        </View>
      </View>

      {errand.detail ? (
        <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }} numberOfLines={2}>
          {errand.detail}
        </Text>
      ) : null}

      {/* 등록일 */}
      <Text style={{ fontSize: 11, color: '#D1D5DB', marginTop: 10 }}>
        {new Date(errand.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </Text>
    </View>
  );
}

export function MyErrandsScreen() {
  const [selectedStatus, setSelectedStatus] = useState<ErrandStatus | undefined>(undefined);
  const { data: profile } = useMyProfile();
  const { data: errands = [], isLoading, refetch } = useMyErrands(selectedStatus);

  const isErrander = profile?.role === 'errander';
  const subtitle = isErrander
    ? '내가 수락한 심부름이에요'
    : '내가 등록한 심부름이에요';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827' }}>내 심부름</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={isLoading ? [] : errands}
        keyExtractor={item => item.errandId}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/errand/${item.errandId}`)}
            style={{ paddingHorizontal: 24 }}
          >
            <ErrandCard errand={item} />
          </TouchableOpacity>
        )}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* 서브타이틀 */}
            <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{subtitle}</Text>
            </View>

            {/* 상태 필터 */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
              {STATUS_FILTERS.map(f => {
                const isActive = selectedStatus === f.value;
                return (
                  <TouchableOpacity
                    key={f.label}
                    onPress={() => setSelectedStatus(f.value)}
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 16,
                      backgroundColor: isActive ? '#F97316' : 'white',
                      borderWidth: 1,
                      borderColor: isActive ? 'transparent' : '#E5E7EB',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? 'white' : '#4B5563' }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#F97316" />
            </View>
          ) : (
            <View style={{ paddingTop: 80, alignItems: 'center', gap: 10 }}>
              <Ionicons name="clipboard-outline" size={52} color="#D1D5DB" />
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>아직 심부름이 없어요.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
