import { useRef } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import WebView from 'react-native-webview';
import { WEB_APP_DEV_URL, WEB_APP_PROD_URL } from '@errander/shared';
import { useWebViewBridge } from '../hooks/useWebViewBridge';
import { useAppStore } from '../stores/appStore';

const WEB_APP_URL = __DEV__ ? WEB_APP_DEV_URL : WEB_APP_PROD_URL;

export function WebViewContainer() {
  const webViewRef = useRef<WebView>(null);
  const { handleMessage } = useWebViewBridge(webViewRef);
  const setWebViewReady = useAppStore((s) => s.setWebViewReady);

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: WEB_APP_URL }}
      style={styles.webView}
      onMessage={handleMessage}
      onLoad={() => setWebViewReady(true)}
      onError={() => setWebViewReady(false)}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
