import { apiClient } from './client';

interface LoginResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const adminLogin = (email: string, password: string) =>
  apiClient.post<LoginResponse>('/admin/auth/login', { email, password });
