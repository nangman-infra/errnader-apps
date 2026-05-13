import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { ChatRoom } from '../types/domain';

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
  if (minutes < 1) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return 'Yesterday';
  return `${Math.floor(hours / 24)}d`;
}

async function fetchChatRooms(): Promise<ChatRoom[]> {
  const { data } = await apiClient.get<{ items: ChatRoomResponse[] }>('/chat/rooms');
  return data.items.map((room) => ({
    id: room.roomId,
    erranderName: room.participantName,
    erranderInitial: room.participantInitial,
    avatarColor: room.avatarColor,
    lastMessage: room.lastMessage,
    time: formatRelativeTime(room.lastMessageAt),
    unreadCount: room.unreadCount,
  }));
}

export function useChatRooms() {
  return useQuery({
    queryKey: ['chatRooms'],
    queryFn: fetchChatRooms,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
}
