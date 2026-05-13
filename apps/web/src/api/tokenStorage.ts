const KEY_ID_TOKEN = 'errander_id_token';
const KEY_REFRESH_TOKEN = 'errander_refresh_token';
const KEY_EXPIRES_AT = 'errander_expires_at';
const EXPIRY_BUFFER_MS = 60_000;

interface AuthTokenInput {
  idToken?: string;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
}

let cachedIdToken: string | null = null;
let cachedRefreshToken: string | null = null;
let cachedExpiresAt = 0;

function canUseLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function initializeStoredTokens() {
  if (!canUseLocalStorage()) return;

  try {
    cachedIdToken = window.localStorage.getItem(KEY_ID_TOKEN);
    cachedRefreshToken = window.localStorage.getItem(KEY_REFRESH_TOKEN);
    const expiresAt = window.localStorage.getItem(KEY_EXPIRES_AT);
    cachedExpiresAt = expiresAt ? Number.parseInt(expiresAt, 10) : 0;
  } catch {
    cachedIdToken = null;
    cachedRefreshToken = null;
    cachedExpiresAt = 0;
  }
}

export function setAuthTokens(tokens: AuthTokenInput) {
  const nextIdToken = tokens.idToken ?? tokens.token ?? null;
  if (!nextIdToken) return;

  const nextRefreshToken = tokens.refreshToken ?? cachedRefreshToken;
  const nextExpiresAt = tokens.expiresIn ? Date.now() + tokens.expiresIn * 1000 : cachedExpiresAt;

  cachedIdToken = nextIdToken;
  cachedRefreshToken = nextRefreshToken;
  cachedExpiresAt = nextExpiresAt;

  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(KEY_ID_TOKEN, nextIdToken);
    if (nextRefreshToken) {
      window.localStorage.setItem(KEY_REFRESH_TOKEN, nextRefreshToken);
    }
    if (nextExpiresAt) {
      window.localStorage.setItem(KEY_EXPIRES_AT, String(nextExpiresAt));
    }
  } catch {
    // Keep the in-memory token cache available even if WebView storage is unavailable.
  }
}

export function clearAuthTokens() {
  cachedIdToken = null;
  cachedRefreshToken = null;
  cachedExpiresAt = 0;

  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(KEY_ID_TOKEN);
    window.localStorage.removeItem(KEY_REFRESH_TOKEN);
    window.localStorage.removeItem(KEY_EXPIRES_AT);
  } catch {
    // Ignore storage cleanup failures in restricted WebView sessions.
  }
}

export function getIdToken(): string | null {
  return cachedIdToken;
}

export function getRefreshToken(): string | null {
  return cachedRefreshToken;
}

export function hasStoredAuthSession(): boolean {
  return !!cachedIdToken;
}

export function isTokenExpired(): boolean {
  if (!cachedExpiresAt) return false;
  return Date.now() > cachedExpiresAt - EXPIRY_BUFFER_MS;
}
