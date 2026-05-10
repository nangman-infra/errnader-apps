import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMyProfile } from '../../hooks/useMyProfile';
import { useErrands } from '../../hooks/useErrands';
import { CITIES } from '../../constants/areas';
import { ErrandBoardCard } from '../errand/ErrandBoardCard';
import { Errand } from '../../types/errand';

const MAX_HOME_CARDS = 5;
const ALL_AREAS = CITIES.flatMap(c => c.areas);

function getAreaNames(areaIds: string[]): string[] {
  return areaIds
    .map(id => ALL_AREAS.find(a => a.id === id)?.name)
    .filter((name): name is string => !!name);
}

function filterByAreas(errands: Errand[], profileAreaIds: string[]): Errand[] {
  if (profileAreaIds.length === 0) return errands;
  // areaId가 있는 심부름은 정확히 매칭, 없는 것은 where 텍스트 매칭으로 fallback
  const areaNames = getAreaNames(profileAreaIds);
  const matched = errands.filter(e =>
    e.areaId
      ? profileAreaIds.includes(e.areaId)
      : areaNames.some(name => e.where.includes(name))
  );
  return matched.length > 0 ? matched : errands;
}

export function NearbyErrandsSection() {
  const { data: profile } = useMyProfile();
  const { data: errands = [], isLoading } = useErrands({ status: 'PENDING' });

  const profileAreaIds = profile?.areas ?? [];
  const areaNames = getAreaNames(profileAreaIds);
  const filtered = filterByAreas(errands, profileAreaIds).slice(0, MAX_HOME_CARDS);

  const sectionTitle = areaNames.length > 0
    ? `${areaNames.slice(0, 2).join(' · ')} 근처 심부름`
    : '등록된 심부름';

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
      {/* 섹션 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{sectionTitle}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/errand')}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>전체보기</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>근처에 등록된 심부름이 없어요.</Text>
        </View>
      ) : (
        filtered.map(errand => (
          <ErrandBoardCard
            key={errand.errandId}
            errand={errand}
            onPress={() => router.push(`/errand/${errand.errandId}`)}
          />
        ))
      )}
    </View>
  );
}
