import { useCallback } from 'react';
import {
  WebViewMessage,
  WebViewMessageType,
  createWebViewMessage,
  parseWebViewMessage,
} from '@errander/shared';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export function useNativeBridge() {
  const isInWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView;

  const sendMessage = useCallback(<T>(type: WebViewMessageType, payload: T) => {
    const message: WebViewMessage<T> = createWebViewMessage(type, payload);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      console.log('[Web] WebView 컨텍스트 외부 — 메시지:', message);
    }
  }, []);

  const onMessage = useCallback(
    (type: WebViewMessageType, handler: (payload: unknown) => void) => {
      const listener = (event: MessageEvent) => {
        const message = parseWebViewMessage(event.data);
        if (message?.type === type) {
          handler(message.payload);
        }
      };
      window.addEventListener('native-message', listener as EventListener);
      return () => window.removeEventListener('native-message', listener as EventListener);
    },
    [],
  );

  return { sendMessage, onMessage, isInWebView };
}
