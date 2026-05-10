import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function StartScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9F4]">
      <View className="flex-1 px-6 pt-4">
        {/* 로고 */}
        <View className="flex-row items-center gap-x-3 mb-24">
          <View className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center">
            <Text className="text-white font-bold text-xl">e</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900">errander</Text>
        </View>

        {/* 히어로 텍스트 */}
        <View className="mb-8">
          <Text className="text-[30px] font-bold text-gray-900 leading-tight mb-3">
            {t('start.tagline')}
          </Text>
          <Text className="text-sm text-gray-500 leading-relaxed">
            {t('start.description')}
          </Text>
        </View>

        {/* 시작하기 버튼 */}
        <TouchableOpacity
          className="bg-orange-500 rounded-2xl py-4 items-center mb-4"
          onPress={() => router.push('/email')}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">{t('start.get_started')}</Text>
        </TouchableOpacity>

        {/* 로그인 링크 */}
        <TouchableOpacity
          className="items-center py-3"
          activeOpacity={0.7}
          onPress={() => router.push('/email')}
        >
          <Text className="text-sm text-gray-800">{t('start.already_have_account')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
