import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ChatRoom } from '../types/chat';

interface ChatRoomResponse {
  roomId: string;
  participantName: string;
  participantInitial: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return 'Yesterday';
  return `${Math.floor(hours / 24)}d`;
}

async function fetchChatRooms(): Promise<ChatRoom[]> {
  const { data } = await apiClient.get<{ items: ChatRoomResponse[] }>('/chat/rooms');
  return data.items.map(r => ({
    id: r.roomId,
    erranderName: r.participantName,
    erranderInitial: r.participantInitial,
    avatarColor: r.avatarColor,
    lastMessage: r.lastMessage,
    time: formatRelativeTime(r.lastMessageAt),
    unreadCount: r.unreadCount,
  }));
}

// WebSocket 연동 시 React Query cache를 직접 업데이트하면 됩니다
export function useChatRooms() {
  return useQuery({
    queryKey: ['chatRooms'],
    queryFn: fetchChatRooms,
  });
}
