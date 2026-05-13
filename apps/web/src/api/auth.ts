import { apiClient } from './client';

interface VerifyOtpResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshTokensResponse {
  idToken: string;
  accessToken: string;
  expiresIn: number;
}

export function sendOtp(email: string) {
  return apiClient.post<{ message: string; expiresIn: number }>('/auth/send-otp', { email });
}

export function verifyOtp(email: string, code: string) {
  return apiClient.post<VerifyOtpResponse>('/auth/verify-otp', { email, code });
}

export function refreshTokens(refreshToken: string) {
  return apiClient.post<RefreshTokensResponse>('/auth/refresh', { refreshToken });
}
