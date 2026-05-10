import { ActivityIndicator, View } from 'react-native';
import { useMyProfile } from '../../src/hooks/useMyProfile';
import { ErranderListScreen } from '../../src/components/errand/ErranderListScreen';
import { ErrandBoardScreen } from '../../src/components/errand/ErrandBoardScreen';

export default function ErrandTab() {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F4' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return profile?.role === 'errander' ? <ErrandBoardScreen /> : <ErranderListScreen />;
}
