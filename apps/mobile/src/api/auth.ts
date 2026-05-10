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

export const sendOtp = (email: string) =>
  apiClient.post<{ message: string; expiresIn: number }>('/auth/send-otp', { email });

export const verifyOtp = (email: string, code: string) =>
  apiClient.post<VerifyOtpResponse>('/auth/verify-otp', { email, code });

export const refreshTokens = (refreshToken: string) =>
  apiClient.post<RefreshTokensResponse>('/auth/refresh', { refreshToken });
