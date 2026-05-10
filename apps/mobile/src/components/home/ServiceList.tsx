import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Service {
  id: string;
  labelKey: string;
  icon: IoniconName;
  iconColor: string;
  bgColor: string;
}

const SERVICES: Service[] = [
  { id: '1', labelKey: 'services.reservation', icon: 'calendar', iconColor: '#EF4444', bgColor: '#FEE2E2' },
  { id: '2', labelKey: 'services.airport_pickup', icon: 'airplane', iconColor: '#F97316', bgColor: '#FFEDD5' },
  { id: '3', labelKey: 'services.navigation', icon: 'navigate', iconColor: '#F59E0B', bgColor: '#FEF3C7' },
  { id: '4', labelKey: 'services.other', icon: 'apps', iconColor: '#F59E0B', bgColor: '#FEF3C7' },
];

interface ServiceItemProps {
  service: Service;
}

function ServiceItem({ service }: ServiceItemProps) {
  const { t } = useTranslation();
  const label = t(service.labelKey);

  return (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 mb-2.5 gap-x-4"
      activeOpacity={0.7}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}
      onPress={() => router.push({ pathname: '/errand-request', params: { what: label } })}
    >
      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: service.bgColor }}>
        <Ionicons name={service.icon} size={24} color={service.iconColor} />
      </View>
      <Text className="flex-1 text-gray-900 font-medium text-base">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

export function ServiceList() {
  const { t } = useTranslation();

  return (
    <View className="px-6 mb-6">
      <Text className="text-gray-900 text-lg font-bold mb-4">{t('services.title')}</Text>
      {SERVICES.map(service => (
        <ServiceItem key={service.id} service={service} />
      ))}
    </View>
  );
}
