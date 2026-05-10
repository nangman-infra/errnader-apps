import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ServiceList } from '../../src/components/home/ServiceList';
import { ErranderSection } from '../../src/components/home/ErranderSection';
import { NearbyErrandsSection } from '../../src/components/home/NearbyErrandsSection';
import { useMyProfile } from '../../src/hooks/useMyProfile';

export default function HomeTab() {
  const { data: profile } = useMyProfile();
  const { t } = useTranslation();
  const isErrander = profile?.role === 'errander';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FFF9F4]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* 헤더 */}
        <View className="px-6 pt-4 pb-5">
          <Text className="text-gray-500 text-sm mb-1">
            {isErrander ? '오늘도 활약해요,' : t('home.greeting')}
          </Text>
          <Text className="text-gray-900 text-2xl font-bold">{profile?.name ?? t('common.loading')} {t('home.wave')}</Text>
        </View>

        {isErrander ? (
          <NearbyErrandsSection />
        ) : (
          <>
            <ServiceList />
            <ErranderSection />
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
