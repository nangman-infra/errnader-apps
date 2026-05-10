import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export function SearchBar() {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="mx-6 mb-5"
      onPress={() => router.push('/errand-request')}
    >
      <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 gap-x-2"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
      >
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          placeholder="오늘은 뭐가 필요하세요?"
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-sm text-gray-700"
          editable={false}
          pointerEvents="none"
        />
      </View>
    </TouchableOpacity>
  );
}
