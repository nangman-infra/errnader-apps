import axios from 'axios';
import { createWebViewMessage } from '@errander/shared';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../constants/app';
import {
  clearAuthTokens,
  getIdToken,
  getRefreshToken,
  initializeStoredTokens,
  setAuthTokens,
} from './tokenStorage';

initializeStoredTokens();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const idToken = getIdToken();
  if (idToken) {
    config.headers.Authorization = idToken;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          setAuthTokens({ idToken: data.idToken, refreshToken, expiresIn: data.expiresIn });
          original.headers.Authorization = data.idToken;
          return apiClient(original);
        } catch {
          clearAuthTokens();
        }
      } else {
        clearAuthTokens();
      }
    }

    if (error.response?.status === 401) {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify(createWebViewMessage('AUTH_REQUEST', { reason: 'token_expired' })),
      );
    }
    return Promise.reject(error);
  },
);
