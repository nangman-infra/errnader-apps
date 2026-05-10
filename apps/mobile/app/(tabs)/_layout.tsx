import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  focusedName: IoniconName;
  color: string;
  focused: boolean;
}

function TabIcon({ name, focusedName, color, focused }: TabIconProps) {
  return <Ionicons name={focused ? focusedName : name} size={22} color={color} />;
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 85,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" focusedName="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="errand"
        options={{
          title: t('tabs.errander'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bag-handle-outline" focusedName="bag-handle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabs.chat'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubble-outline" focusedName="chatbubble" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: t('tabs.my'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" focusedName="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
