import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, Country } from '../../constants/countries';

interface CountryPickerModalProps {
  visible: boolean;
  selected: Country | null;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export function CountryPickerModal({ visible, selected, onSelect, onClose }: CountryPickerModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => COUNTRIES.filter(c => c.name.includes(query) || c.code.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const handleSelect = (country: Country) => {
    onSelect(country);
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' }}>국적 선택</Text>
          <TouchableOpacity onPress={() => { setQuery(''); onClose(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* 검색창 */}
        <View style={{ margin: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="국가 검색"
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 15, color: '#111827' }}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.code}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 14,
                gap: 14,
                backgroundColor: selected?.code === item.code ? '#FFF7ED' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 28 }}>{item.flag}</Text>
              <Text style={{ flex: 1, fontSize: 16, color: '#111827' }}>{item.name}</Text>
              {selected?.code === item.code && (
                <Ionicons name="checkmark" size={20} color="#F97316" />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 20 }} />}
        />
      </SafeAreaView>
    </Modal>
  );
}
