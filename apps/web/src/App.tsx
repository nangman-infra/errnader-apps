import { useNativeBridge } from './hooks/useNativeBridge';

function App() {
  const { isInWebView } = useNativeBridge();

  return (
    <div className="min-h-screen bg-white">
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          errander
        </h1>
        <p className="text-gray-500">
          {isInWebView ? '📱 네이티브 앱 내에서 실행 중' : '🌐 브라우저에서 실행 중'}
        </p>
      </main>
    </div>
  );
}

export default App;
