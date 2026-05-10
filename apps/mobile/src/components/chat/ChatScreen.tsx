import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useChatRooms } from '../../hooks/useChatRooms';
import { ChatRoom } from '../../types/chat';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
} as const;

export function ChatScreen() {
  const { data: chatRooms = [], isLoading } = useChatRooms();

  const ListHeader = () => (
    <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>채팅</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
        <ListHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <ListHeader />

      {chatRooms.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>아직 채팅이 없어요.</Text>
        </View>
      ) : (
        <View
          style={[
            {
              marginHorizontal: 24,
              backgroundColor: 'white',
              borderRadius: 20,
            },
            CARD_SHADOW,
          ]}
        >
          {chatRooms.map((room, index) => (
            <View key={room.id}>
              <ChatRoomItem room={room} />
              {index < chatRooms.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: '#F3F4F6',
                    marginHorizontal: 20,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function ChatRoomItem({ room }: { room: ChatRoom }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
      }}
      onPress={() => router.push(`/chat/${room.id}`)}
    >
      {/* 아바타 */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: room.avatarColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {room.erranderInitial}
        </Text>
      </View>

      {/* 이름 + 마지막 메시지 */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
          {room.erranderName}
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280' }} numberOfLines={1}>
          {room.lastMessage}
        </Text>
      </View>

      {/* 시간 + 읽지 않은 배지 */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{room.time}</Text>
        {room.unreadCount > 0 && (
          <View
            style={{
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#F97316',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 5,
            }}
          >
            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
              {room.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
