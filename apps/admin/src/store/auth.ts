const KEY_ID_TOKEN = 'admin_id_token';
const KEY_REFRESH_TOKEN = 'admin_refresh_token';
const KEY_EXPIRES_AT = 'admin_expires_at';
const EXPIRY_BUFFER_MS = 60_000;

export interface AuthTokens {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

export function isAdminToken(idToken: string): boolean {
  try {
    const payload = decodeJwtPayload(idToken);
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
    return groups.includes('Admins');
  } catch {
    return false;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  localStorage.setItem(KEY_ID_TOKEN, tokens.idToken);
  localStorage.setItem(KEY_REFRESH_TOKEN, tokens.refreshToken);
  localStorage.setItem(KEY_EXPIRES_AT, String(expiresAt));
}

export function getIdToken(): string | null {
  return localStorage.getItem(KEY_ID_TOKEN);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEY_REFRESH_TOKEN);
}

export function isTokenExpired(): boolean {
  const expiresAt = parseInt(localStorage.getItem(KEY_EXPIRES_AT) ?? '0', 10);
  return Date.now() > expiresAt - EXPIRY_BUFFER_MS;
}

export function clearTokens(): void {
  localStorage.removeItem(KEY_ID_TOKEN);
  localStorage.removeItem(KEY_REFRESH_TOKEN);
  localStorage.removeItem(KEY_EXPIRES_AT);
}
