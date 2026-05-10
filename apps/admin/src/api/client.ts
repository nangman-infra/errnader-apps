import axios from 'axios';
import { getIdToken } from '../store/auth';

const BASE_URL = 'https://bj9l28xy18.execute-api.ap-northeast-2.amazonaws.com/dev';

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
