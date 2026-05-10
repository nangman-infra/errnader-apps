import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CITIES } from '../../constants/areas';

interface FilterChipsProps {
  selected: string;
  onSelect: (areaId: string) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  const { t } = useTranslation();
  const ALL_AREAS = [
    { id: '전체', name: t('errander_list.filter_all') },
    ...CITIES.flatMap((city) => city.areas),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      style={{ marginBottom: 16 }}
    >
      {ALL_AREAS.map((area) => {
        const isActive = area.id === selected;
        return (
          <TouchableOpacity
            key={area.id}
            onPress={() => onSelect(area.id)}
            activeOpacity={0.75}
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive ? '#F97316' : 'white',
              borderWidth: 1,
              borderColor: isActive ? 'transparent' : '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? 'white' : '#4B5563' }}>
              {area.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
