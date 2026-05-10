import { View, Text, TouchableOpacity } from 'react-native';
import { CITIES, MAX_AREAS } from '../../constants/areas';

interface AreaSelectorProps {
  selected: string[];
  onChange: (areas: string[]) => void;
}

export function AreaSelector({ selected, onChange }: AreaSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((a) => a !== id));
    } else {
      if (selected.length >= MAX_AREAS) return;
      onChange([...selected, id]);
    }
  };

  return (
    <View>
      {CITIES.map((city) => (
        <View key={city.id}>
          {/* 도시 헤더 + 카운터 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>{city.name}</Text>
            <Text style={{ fontSize: 12, color: selected.length >= MAX_AREAS ? '#F97316' : '#9CA3AF' }}>
              {selected.length}/{MAX_AREAS}
            </Text>
          </View>

          {/* 칩 그리드 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {city.areas.map((area) => {
              const isSelected = selected.includes(area.id);
              const isDisabled = !isSelected && selected.length >= MAX_AREAS;
              return (
                <TouchableOpacity
                  key={area.id}
                  onPress={() => toggle(area.id)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    backgroundColor: isSelected ? '#F97316' : 'white',
                    borderColor: isSelected ? '#F97316' : isDisabled ? '#E5E7EB' : '#D1D5DB',
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? 'white' : isDisabled ? '#D1D5DB' : '#374151',
                  }}>
                    {area.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
