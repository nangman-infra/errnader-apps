import '../global.css';
import '../src/i18n';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QUERY_CACHE_TIME_MS, QUERY_STALE_TIME_MS } from '@errander/shared';
import {
  initializeTokens,
  getIdToken,
  isTokenExpired,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../src/api/tokenStorage';
import { refreshTokens } from '../src/api/auth';
import { apiClient } from '../src/api/client';
import { loadSavedLanguage } from '../src/i18n';
import i18n from '../src/i18n';
import { useChatWebSocket } from '../src/hooks/useChatWebSocket';

function AppWebSocket() {
  useChatWebSocket();
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_CACHE_TIME_MS,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    async function bootstrap() {
      const savedLang = await loadSavedLanguage();
      await i18n.changeLanguage(savedLang);

      await initializeTokens();

      const idToken = getIdToken();
      const storedRefreshToken = getRefreshToken();

      if (idToken && !isTokenExpired()) {
        try {
          const { data } = await apiClient.get('/me');
          router.replace(data?.name ? '/(tabs)' : '/profile-setup');
        } catch {
          await clearTokens();
        }
        return;
      }

      if (storedRefreshToken) {
        try {
          const { data } = await refreshTokens(storedRefreshToken);
          await setTokens({ idToken: data.idToken, refreshToken: storedRefreshToken, expiresIn: data.expiresIn });
          router.replace('/(tabs)');
        } catch {
          // 갱신 실패 → 로그인 화면 유지
        }
      }
    }
    bootstrap();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AppWebSocket />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
