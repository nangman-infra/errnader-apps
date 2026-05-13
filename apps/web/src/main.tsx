import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './i18n';
import App from './App.tsx';

function postBootstrapDebug(payload: Record<string, unknown>) {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: '__ERRANDER_WEB_DEBUG__',
      payload,
    }),
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

postBootstrapDebug({
  kind: 'bootstrap-start',
  href: window.location.href,
  rootChildCount: rootElement.childElementCount,
});

try {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );

  window.setTimeout(() => {
    postBootstrapDebug({
      kind: 'bootstrap-rendered',
      href: window.location.href,
      rootChildCount: rootElement.childElementCount,
    });
  }, 0);

  window.setTimeout(() => {
    postBootstrapDebug({
      kind: 'bootstrap-rendered-delayed',
      href: window.location.href,
      rootChildCount: rootElement.childElementCount,
    });
  }, 800);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  postBootstrapDebug({
    kind: 'bootstrap-error',
    href: window.location.href,
    message,
  });
  throw error;
}
