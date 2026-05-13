import '../global.css';
import '../src/i18n';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QUERY_CACHE_TIME_MS, QUERY_STALE_TIME_MS } from '@errander/shared';
import { loadSavedLanguage } from '../src/i18n';
import i18n from '../src/i18n';

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
    }
    bootstrap();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
