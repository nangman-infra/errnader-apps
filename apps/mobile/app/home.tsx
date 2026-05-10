import { View, StyleSheet } from 'react-native';
import { WebViewContainer } from '../src/components/WebViewContainer';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <WebViewContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
