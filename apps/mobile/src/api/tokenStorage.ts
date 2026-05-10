import * as SecureStore from 'expo-secure-store';

const KEY_ID_TOKEN = 'errander_id_token';
const KEY_REFRESH_TOKEN = 'errander_refresh_token';
const KEY_EXPIRES_AT = 'errander_expires_at';
const EXPIRY_BUFFER_MS = 60_000; // 만료 1분 전에 갱신

// 메모리 캐시 — axios 인터셉터에서 동기적으로 읽기 위해 필요
let cachedIdToken: string | null = null;
let cachedRefreshToken: string | null = null;
let cachedExpiresAt: number = 0;

// 앱 시작 시 SecureStore → 메모리 캐시로 로드
export const initializeTokens = async (): Promise<void> => {
  const [idToken, refreshToken, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(KEY_ID_TOKEN),
    SecureStore.getItemAsync(KEY_REFRESH_TOKEN),
    SecureStore.getItemAsync(KEY_EXPIRES_AT),
  ]);
  cachedIdToken = idToken;
  cachedRefreshToken = refreshToken;
  cachedExpiresAt = expiresAt ? parseInt(expiresAt, 10) : 0;
};

export const setTokens = async (tokens: {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<void> => {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  cachedIdToken = tokens.idToken;
  cachedRefreshToken = tokens.refreshToken;
  cachedExpiresAt = expiresAt;
  await Promise.all([
    SecureStore.setItemAsync(KEY_ID_TOKEN, tokens.idToken),
    SecureStore.setItemAsync(KEY_REFRESH_TOKEN, tokens.refreshToken),
    SecureStore.setItemAsync(KEY_EXPIRES_AT, String(expiresAt)),
  ]);
};

export const getIdToken = (): string | null => cachedIdToken;
export const getRefreshToken = (): string | null => cachedRefreshToken;
export const isTokenExpired = (): boolean => Date.now() > cachedExpiresAt - EXPIRY_BUFFER_MS;

export const clearTokens = async (): Promise<void> => {
  cachedIdToken = null;
  cachedRefreshToken = null;
  cachedExpiresAt = 0;
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ID_TOKEN),
    SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEY_EXPIRES_AT),
  ]);
};
