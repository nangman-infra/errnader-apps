import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getIdToken } from '../api/tokenStorage';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL!;
const RECONNECT_DELAY_MS = 5000;

export function useChatWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    function connect() {
      if (!activeRef.current) return;

      const token = getIdToken();
      if (!token) {
        // 토큰이 아직 없으면 잠시 후 재시도 (로그인 전 상태)
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
        return;
      }

      const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'NEW_MESSAGE') {
            queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', data.roomId] });
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (activeRef.current) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // 앱이 포그라운드로 복귀하면 연결 재시도
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connect();
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      activeRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      sub.remove();
    };
  }, [queryClient]);
}
