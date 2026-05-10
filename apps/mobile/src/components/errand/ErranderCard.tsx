import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Errander, BadgeType } from '../../types/errander';

interface BadgeConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

const BADGE_CONFIG: Record<BadgeType, BadgeConfig> = {
  popular:       { label: '인기',      bgColor: '#FFEDD5', textColor: '#EA580C' },
  fast_response: { label: '빠른 응답', bgColor: '#FEE2E2', textColor: '#DC2626' },
  top_rated:     { label: '5.0 ★',    bgColor: '#FFEDD5', textColor: '#EA580C' },
  new:           { label: '신규',      bgColor: '#D1FAE5', textColor: '#059669' },
  native_en:     { label: 'Native EN', bgColor: '#E0F2FE', textColor: '#0284C7' },
};

interface ErranderCardProps {
  errander: Errander;
  onPress?: () => void;
}

export function ErranderCard({ errander, onPress }: ErranderCardProps) {
  const badge = errander.badge ? BADGE_CONFIG[errander.badge] : null;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-x-4"
      activeOpacity={0.75}
      onPress={onPress}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
    >
      {/* 아바타 */}
      <View
        className="w-14 h-14 rounded-full items-center justify-center"
        style={{ backgroundColor: errander.avatarColor }}
      >
        <Text className="text-white font-bold text-xl">{errander.initial}</Text>
      </View>

      {/* 정보 */}
      <View className="flex-1">
        {/* 이름 + 배지 */}
        <View className="flex-row items-center gap-x-2 mb-0.5">
          <Text className="text-gray-900 font-bold text-base">{errander.name}</Text>
          {badge && (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bgColor }}>
              <Text className="text-xs font-semibold" style={{ color: badge.textColor }}>
                {badge.label}
              </Text>
            </View>
          )}
        </View>

        {/* 전문 분야 */}
        <Text className="text-gray-500 text-sm mb-1">{errander.specialty}</Text>

        {/* 별점 · 완료 건수 · 언어 */}
        <View className="flex-row items-center gap-x-1">
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text className="text-gray-700 text-xs font-medium">{errander.rating}</Text>
          <Text className="text-gray-400 text-xs">
            · {errander.completedJobs}건 완료 · {errander.languages.join('·')}
          </Text>
        </View>
      </View>

      {/* 가격 */}
      <View className="items-end">
        <Text className="text-orange-500 font-bold text-base">
          ₩{(errander.pricePerHour / 1000).toFixed(0)}k
        </Text>
        <Text className="text-gray-400 text-xs">/시간</Text>
      </View>
    </TouchableOpacity>
  );
}
