import { useCallback, useEffect, useState } from 'react';
import {
  WebViewMessage,
  WebViewMessageType,
  createWebViewMessage,
  parseWebViewMessage,
} from '@errander/shared';
import { setAuthTokens } from '../api/tokenStorage';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

function readMessageData(event: MessageEvent): string {
  return typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
}

export function useNativeBridge() {
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const isInWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView;

  const sendMessage = useCallback(<T,>(type: WebViewMessageType, payload: T) => {
    const message: WebViewMessage<T> = createWebViewMessage(type, payload);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      console.log('[Web] WebView 컨텍스트 외부 메시지:', message);
    }
  }, []);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = parseWebViewMessage(readMessageData(event));
      if (message?.type === 'AUTH_TOKEN' || message?.type === 'AUTH_RESPONSE') {
        setAuthTokens(message.payload as { idToken?: string; token?: string; refreshToken?: string });
        setHasAuthToken(true);
      }
    };

    window.addEventListener('message', listener);
    window.addEventListener('native-message', listener as EventListener);
    return () => {
      window.removeEventListener('message', listener);
      window.removeEventListener('native-message', listener as EventListener);
    };
  }, []);

  return { sendMessage, isInWebView, hasAuthToken };
}
