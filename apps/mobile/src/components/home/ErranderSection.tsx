import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface Errander {
  id: string;
  initial: string;
  name: string;
  rating: number;
  reviews: number;
  specialty: string;
  languages: string[];
  pricePerHour: number;
  avatarColor: string;
}

const DEMO_ERRANDERS: Errander[] = [
  {
    id: '1',
    initial: '민',
    name: '민준',
    rating: 4.9,
    reviews: 312,
    specialty: '공항 픽업',
    languages: ['EN', 'KO'],
    pricePerHour: 22000,
    avatarColor: '#F97316',
  },
  {
    id: '2',
    initial: '소',
    name: '소연',
    rating: 4.8,
    reviews: 198,
    specialty: 'K-pop·쇼핑',
    languages: ['EN', 'KO', 'CN'],
    pricePerHour: 18000,
    avatarColor: '#EF4444',
  },
  {
    id: '3',
    initial: '지',
    name: '지호',
    rating: 4.7,
    reviews: 87,
    specialty: '맛집·통역',
    languages: ['EN', 'KO', 'JP'],
    pricePerHour: 20000,
    avatarColor: '#8B5CF6',
  },
];

interface ErranderCardProps {
  errander: Errander;
}

function ErranderCard({ errander }: ErranderCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      className="w-44 bg-white rounded-2xl p-4 mr-3"
      activeOpacity={0.8}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
    >
      {/* 아바타 */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: errander.avatarColor }}
      >
        <Text className="text-white font-bold text-base">{errander.initial}</Text>
      </View>

      {/* 이름 + 별점 */}
      <Text className="text-gray-900 font-semibold text-sm mb-0.5">{errander.name}</Text>
      <View className="flex-row items-center gap-x-1 mb-2">
        <Ionicons name="star" size={12} color="#F59E0B" />
        <Text className="text-gray-700 text-xs font-medium">{errander.rating}</Text>
        <Text className="text-gray-400 text-xs">· {errander.reviews}</Text>
      </View>

      {/* 전문 분야 */}
      <Text className="text-gray-500 text-xs mb-2">{errander.specialty}</Text>

      {/* 언어 + 가격 */}
      <View className="flex-row items-center justify-between">
        <Text className="text-gray-400 text-xs">{errander.languages.join(' · ')}</Text>
      </View>
      <Text className="text-orange-500 text-xs font-semibold mt-1">
        ₩{(errander.pricePerHour / 1000).toFixed(0)}k{t('errander_list.per_hour')}
      </Text>
    </TouchableOpacity>
  );
}

export function ErranderSection() {
  const { t } = useTranslation();

  return (
    <View className="mb-6">
      {/* 섹션 헤더 */}
      <View className="flex-row items-center justify-between px-6 mb-3">
        <Text className="text-gray-900 text-lg font-bold">{t('home.errander_section')}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/errand')}>
          <Text className="text-orange-500 text-sm font-medium">{t('home.view_all')}</Text>
        </TouchableOpacity>
      </View>

      {/* 가로 스크롤 카드 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}
      >
        {DEMO_ERRANDERS.map(errander => (
          <ErranderCard key={errander.id} errander={errander} />
        ))}
      </ScrollView>
    </View>
  );
}
