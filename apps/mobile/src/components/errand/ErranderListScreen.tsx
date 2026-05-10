import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useErranders } from '../../hooks/useErranders';
import { Errander } from '../../types/errander';
import { ErranderCard } from './ErranderCard';
import { FilterChips } from './FilterChips';

export function ErranderListScreen() {
  const [selectedArea, setSelectedArea] = useState('전체');
  const { data: erranders = [], isLoading } = useErranders(selectedArea);
  const { t } = useTranslation();

  const renderErrander = ({ item }: { item: Errander }) => (
    <View style={{ paddingHorizontal: 24 }}>
      <ErranderCard
        errander={item}
        onPress={() => {
          // TODO: 심부름꾼 상세 페이지로 이동
        }}
      />
    </View>
  );

  const ListHeader = useCallback(
    () => (
      <View>
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{t('errander_list.title')}</Text>
        </View>
        <View
          style={{
            marginHorizontal: 24,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder={t('errander_list.search_placeholder')}
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 14, color: '#374151' }}
          />
        </View>
        <FilterChips selected={selectedArea} onSelect={setSelectedArea} />
      </View>
    ),
    [selectedArea],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <FlatList
        data={isLoading ? [] : erranders}
        keyExtractor={item => item.id}
        renderItem={renderErrander}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#F97316" />
            </View>
          ) : (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>{t('errander_list.empty')}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
