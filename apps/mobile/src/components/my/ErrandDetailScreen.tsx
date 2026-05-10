import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useErrand } from '../../hooks/useErrands';
import { useMyProfile } from '../../hooks/useMyProfile';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { ErrandStatus } from '../../types/errand';
import { CITIES } from '../../constants/areas';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ALL_AREAS = CITIES.flatMap(c => c.areas);

const STATUS_CONFIG: Record<ErrandStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: '대기중', color: '#D97706', bg: '#FEF3C7' },
  ACCEPTED:  { label: '진행중', color: '#2563EB', bg: '#EFF6FF' },
  COMPLETED: { label: '완료',   color: '#059669', bg: '#D1FAE5' },
  CANCELLED: { label: '취소',   color: '#6B7280', bg: '#F3F4F6' },
};

const CATEGORY_CONFIG: Record<string, { icon: IoniconName; color: string; bg: string }> = {
  '예약 대행':     { icon: 'calendar',  color: '#EF4444', bg: '#FEE2E2' },
  '공항 픽업':     { icon: 'airplane',  color: '#F97316', bg: '#FFEDD5' },
  '길찾기':        { icon: 'navigate',  color: '#F59E0B', bg: '#FEF3C7' },
  'Reservation':   { icon: 'calendar',  color: '#EF4444', bg: '#FEE2E2' },
  'Airport Pickup':{ icon: 'airplane',  color: '#F97316', bg: '#FFEDD5' },
  'Navigation':    { icon: 'navigate',  color: '#F59E0B', bg: '#FEF3C7' },
};
const DEFAULT_CAT = { icon: 'apps-outline' as IoniconName, color: '#6B7280', bg: '#F3F4F6' };

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
} as const;

export function ErrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: errand, isLoading, isError } = useErrand(id);
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();

  const isErrander = profile?.role === 'errander';
  const st = errand ? (STATUS_CONFIG[errand.status] ?? STATUS_CONFIG.PENDING) : null;
  const cat = errand ? (CATEGORY_CONFIG[errand.category] ?? DEFAULT_CAT) : DEFAULT_CAT;
  const areaName = ALL_AREAS.find(a => a.id === errand?.areaId)?.name ?? null;

  const handleAccept = async () => {
    if (!errand) return;
    Alert.alert('수락하기', '이 심부름을 수락할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '수락',
        onPress: async () => {
          try {
            await apiClient.patch(`/errands/${errand.errandId}/status`, { status: 'ACCEPTED' });
            await queryClient.invalidateQueries({ queryKey: ['errand', errand.errandId] });
            await queryClient.invalidateQueries({ queryKey: ['errands'] });
          } catch {
            Alert.alert('오류', '수락에 실패했어요. 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    if (!errand) return;
    Alert.alert('심부름 취소', '등록한 심부름을 취소할까요?', [
      { text: '아니요', style: 'cancel' },
      {
        text: '취소하기',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.patch(`/errands/${errand.errandId}/status`, { status: 'CANCELLED' });
            await queryClient.invalidateQueries({ queryKey: ['errand', errand.errandId] });
            await queryClient.invalidateQueries({ queryKey: ['errands'] });
            router.back();
          } catch {
            Alert.alert('오류', '취소에 실패했어요. 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !errand || !st) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>심부름 정보를 불러올 수 없어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showAcceptBtn = isErrander && errand.status === 'PENDING';
  const showCancelBtn = !isErrander && errand.status === 'PENDING';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827' }}>심부름 상세</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

        {/* 상태 배지 + 카테고리 + 제목 */}
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 12, ...CARD_SHADOW }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: st.bg }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: st.color }}>{st.label}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={cat.icon} size={26} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{errand.category}</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{errand.title}</Text>
            </View>
          </View>
        </View>

        {/* 세부 정보 카드 */}
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 12, ...CARD_SHADOW }}>
          <InfoRow icon="time-outline" label="언제" value={errand.when} />
          {(areaName || errand.where) && (
            <>
              <Divider />
              <InfoRow
                icon="location-outline"
                label="어디서"
                value={[areaName, errand.where].filter(Boolean).join(' · ')}
              />
            </>
          )}
          <Divider />
          <InfoRow
            icon="calendar-outline"
            label="등록일"
            value={new Date(errand.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          />
          {errand.erranderId && (
            <>
              <Divider />
              <InfoRow icon="person-outline" label="심부름꾼" value="매칭됨" highlight />
            </>
          )}
        </View>

        {/* 사진 섹션 */}
        {errand.photoUrls.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 12, ...CARD_SHADOW }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 }}>첨부 사진</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {errand.photoUrls.map((url, idx) => (
                <Image
                  key={idx}
                  source={{ uri: url }}
                  style={{ width: 88, height: 88, borderRadius: 12 }}
                />
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* 하단 버튼 */}
      {(showAcceptBtn || showCancelBtn) && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12, backgroundColor: '#FFF9F4' }}>
          {showAcceptBtn && (
            <TouchableOpacity
              onPress={handleAccept}
              activeOpacity={0.85}
              style={{ backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>수락하기</Text>
            </TouchableOpacity>
          )}
          {showCancelBtn && (
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.85}
              style={{ backgroundColor: 'white', paddingVertical: 16, borderRadius: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#EF4444' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>심부름 취소하기</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, highlight }: { icon: IoniconName; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color="#9CA3AF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: highlight ? '#F97316' : '#111827' }}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />;
}
