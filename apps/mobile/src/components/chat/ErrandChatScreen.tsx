import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useMyProfile } from '../../hooks/useMyProfile';
import { useErrand } from '../../hooks/useErrands';

interface Message {
  messageId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

function useMessages(roomId: string) {
  return useQuery<Message[]>({
    queryKey: ['chat', roomId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/chat/rooms/${roomId}/messages`);
      return data.messages ?? [];
    },
    refetchInterval: 3000,
    staleTime: 0,
  });
}

function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/chat/rooms/${roomId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', roomId] });
    },
  });
}

export function ErrandChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: errand } = useErrand(roomId);
  const { data: messages = [], isLoading } = useMessages(roomId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(roomId);

  // 채팅방 진입 시 캐시에서 해당 방의 unreadCount를 즉시 0으로 설정
  useEffect(() => {
    queryClient.setQueryData<import('../../types/chat').ChatRoom[]>(['chatRooms'], old =>
      old?.map(room => room.id === roomId ? { ...room, unreadCount: 0 } : room)
    );
  }, [roomId, queryClient]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    sendMessage(text);
  };

  const errandTitle = errand?.title ?? '채팅';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      {/* 헤더 */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
            {errandTitle}
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>여행자와의 채팅</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.messageId}
            contentContainerStyle={{
              padding: 16,
              gap: 8,
              flexGrow: 1,
              justifyContent: messages.length === 0 ? 'center' : 'flex-start',
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>첫 메시지를 보내보세요</Text>
                <Text style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center' }}>
                  심부름에 대해 궁금한 점을 물어보세요
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMine = item.senderId === profile?.userId;
              return (
                <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  {!isMine && (
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3, marginLeft: 4 }}>
                      {item.senderName}
                    </Text>
                  )}
                  <View style={{
                    maxWidth: '75%',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 18,
                    borderBottomRightRadius: isMine ? 4 : 18,
                    borderBottomLeftRadius: isMine ? 18 : 4,
                    backgroundColor: isMine ? '#F97316' : 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}>
                    <Text style={{ fontSize: 14, color: isMine ? 'white' : '#111827', lineHeight: 20 }}>
                      {item.content}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, marginHorizontal: 4 }}>
                    {new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {/* 입력창 */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end',
          paddingHorizontal: 16, paddingVertical: 12, gap: 10,
          borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: 'white',
        }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#9CA3AF"
            multiline
            style={{
              flex: 1, fontSize: 14, color: '#111827',
              maxHeight: 100, paddingVertical: 10, paddingHorizontal: 14,
              backgroundColor: '#F9FAFB', borderRadius: 20,
              borderWidth: 1, borderColor: '#E5E7EB',
            }}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isSending}
            activeOpacity={0.8}
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: input.trim() && !isSending ? '#F97316' : '#E5E7EB',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isSending
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="send" size={18} color={input.trim() ? 'white' : '#9CA3AF'} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
