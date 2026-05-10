import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useErrands } from '../../hooks/useErrands';
import { Errand } from '../../types/errand';
import { ErrandBoardCard } from './ErrandBoardCard';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_FILTERS: { label: string; value: string | undefined; icon: IoniconName }[] = [
  { label: '전체',      value: undefined,     icon: 'apps-outline' },
  { label: '예약 대행', value: '예약 대행',   icon: 'calendar-outline' },
  { label: '공항 픽업', value: '공항 픽업',   icon: 'airplane-outline' },
  { label: '길찾기',    value: '길찾기',      icon: 'navigate-outline' },
  { label: '기타',      value: '기타',        icon: 'ellipsis-horizontal-outline' },
];

export function ErrandBoardScreen() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data: errands = [], isLoading, refetch } = useErrands({ category: selectedCategory });

  const renderErrand = ({ item }: { item: Errand }) => (
    <View style={{ paddingHorizontal: 24 }}>
      <ErrandBoardCard errand={item} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <FlatList
        data={isLoading ? [] : errands}
        keyExtractor={item => item.errandId}
        renderItem={renderErrand}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* 헤더 */}
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>심부름 요청</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>여행자들의 심부름 요청이에요</Text>
            </View>

            {/* 카테고리 필터 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
              {CATEGORY_FILTERS.map(filter => {
                const isActive = selectedCategory === filter.value;
                return (
                  <TouchableOpacity
                    key={filter.label}
                    onPress={() => setSelectedCategory(filter.value)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? '#F97316' : 'white',
                      borderWidth: 1,
                      borderColor: isActive ? 'transparent' : '#E5E7EB',
                    }}
                  >
                    <Ionicons name={filter.icon} size={14} color={isActive ? 'white' : '#6B7280'} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? 'white' : '#4B5563' }}>
                      {filter.label}
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
            <View style={{ paddingTop: 80, alignItems: 'center', gap: 8 }}>
              <Ionicons name="clipboard-outline" size={48} color="#D1D5DB" />
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>아직 등록된 심부름이 없어요.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
