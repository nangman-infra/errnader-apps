import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WS_BASE_URL } from '../constants/app';
import { getIdToken } from '../api/tokenStorage';

const RECONNECT_DELAY_MS = 5_000;

export function useChatWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function scheduleReconnect() {
      clearReconnectTimer();
      reconnectTimerRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
    }

    function connect() {
      if (!activeRef.current) return;

      const token = getIdToken();
      if (!token) {
        scheduleReconnect();
        return;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(`${WS_BASE_URL}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'NEW_MESSAGE') {
            queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', data.roomId] });
          }
        } catch {
          // Ignore malformed payloads from the socket.
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (activeRef.current) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const socket = wsRef.current;
        if (!socket || socket.readyState === WebSocket.CLOSED) {
          connect();
        }
      }
    };

    window.addEventListener('focus', connect);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activeRef.current = false;
      clearReconnectTimer();
      window.removeEventListener('focus', connect);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [queryClient]);
}
