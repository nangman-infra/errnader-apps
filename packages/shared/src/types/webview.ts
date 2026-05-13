export type WebViewMessageType =
  | 'NAVIGATE'
  | 'GET_USER_LOCATION'
  | 'LOCATION_RESPONSE'
  | 'AUTH_TOKEN'
  | 'AUTH_REQUEST'
  | 'AUTH_RESPONSE'
  | 'ERROR';

export interface WebViewMessage<T = unknown> {
  type: WebViewMessageType;
  payload: T;
}

export interface NavigatePayload {
  screen: string;
  params?: Record<string, unknown>;
}

export interface LocationResponsePayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AuthRequestPayload {
  provider?: 'google' | 'apple' | 'kakao';
  reason?: 'token_expired' | 'logout' | 'delete_account';
}

export interface AuthResponsePayload {
  token?: string;
  idToken?: string;
  refreshToken?: string;
  userId?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
