import axios from 'axios';
import { getIdToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getIdToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = token;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      await clearTokens();
      isRefreshing = false;
      return Promise.reject(err);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      await setTokens({ idToken: data.idToken, refreshToken, expiresIn: data.expiresIn });
      processQueue(null, data.idToken);
      original.headers.Authorization = data.idToken;
      return apiClient(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await clearTokens();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
