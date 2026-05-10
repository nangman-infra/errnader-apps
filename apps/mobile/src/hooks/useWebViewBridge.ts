import { RefObject, useCallback } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import {
  WebViewMessage,
  WebViewMessageType,
  createWebViewMessage,
  parseWebViewMessage,
} from '@errander/shared';

export function useWebViewBridge(webViewRef: RefObject<WebView | null>) {
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseWebViewMessage(event.nativeEvent.data);
      if (!message) {
        console.error('[Native] 메시지 파싱 실패:', event.nativeEvent.data);
        return;
      }
      console.log('[Native] 수신된 메시지:', message);
    },
    [],
  );

  const sendMessage = useCallback(
    <T>(type: WebViewMessageType, payload: T) => {
      if (!webViewRef.current) return;

      const message: WebViewMessage<T> = createWebViewMessage(type, payload);
      const js = `
        window.dispatchEvent(
          new MessageEvent('native-message', {
            data: ${JSON.stringify(JSON.stringify(message))}
          })
        );
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    },
    [webViewRef],
  );

  return { handleMessage, sendMessage };
}
