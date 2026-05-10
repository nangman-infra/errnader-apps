import { WebViewMessage, WebViewMessageType } from '../types/webview';

export function createWebViewMessage<T>(
  type: WebViewMessageType,
  payload: T,
): WebViewMessage<T> {
  return { type, payload };
}

export function parseWebViewMessage(raw: string): WebViewMessage | null {
  try {
    return JSON.parse(raw) as WebViewMessage;
  } catch {
    return null;
  }
}
