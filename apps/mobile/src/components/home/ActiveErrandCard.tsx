import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActiveErrandCardProps {
  erranderInitial: string;
  erranderName: string;
  taskTitle: string;
  etaMinutes: number;
}

export function ActiveErrandCard({ erranderInitial, erranderName, taskTitle, etaMinutes }: ActiveErrandCardProps) {
  return (
    <TouchableOpacity
      className="mx-6 mb-6 rounded-2xl p-4 flex-row items-center gap-x-3"
      style={{ backgroundColor: '#1C1C1E' }}
      activeOpacity={0.85}
    >
      {/* 심부름꾼 아바타 */}
      <View className="w-11 h-11 rounded-full bg-orange-500 items-center justify-center">
        <Text className="text-white font-bold text-base">{erranderInitial}</Text>
      </View>

      {/* 정보 */}
      <View className="flex-1">
        <Text className="text-orange-400 text-xs font-semibold mb-0.5">진행중</Text>
        <Text className="text-white font-semibold text-sm mb-0.5" numberOfLines={1}>
          {erranderName} · {taskTitle}
        </Text>
        <View className="flex-row items-center gap-x-1">
          <Ionicons name="time-outline" size={12} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs">도착 {etaMinutes} 분</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#6B7280" />
    </TouchableOpacity>
  );
}
