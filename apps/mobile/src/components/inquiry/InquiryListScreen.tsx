import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useInquiries } from '../../hooks/useInquiries';
import { Inquiry } from '../../types/inquiry';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
} as const;

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function InquiryItem({ item }: { item: Inquiry }) {
  const isPending = item.status === 'pending';
  return (
    <View
      style={[
        {
          marginHorizontal: 24,
          marginBottom: 12,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 18,
        },
        CARD_SHADOW,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            backgroundColor: isPending ? '#FEF3C7' : '#DCFCE7',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: isPending ? '#D97706' : '#16A34A' }}>
            {isPending ? '답변 대기' : '답변 완료'}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 }} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }} numberOfLines={2}>
        {item.content}
      </Text>

      {item.answer && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#F97316', marginBottom: 4 }}>
            답변
          </Text>
          <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export function InquiryListScreen() {
  const { data: inquiries = [], isLoading } = useInquiries();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <FlatList
        data={isLoading ? [] : inquiries}
        keyExtractor={item => item.inquiryId}
        renderItem={({ item }) => <InquiryItem item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ marginRight: 12 }}
              >
                <Ionicons name="arrow-back" size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', flex: 1 }}>
                1:1 문의
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/inquiry-create')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#F97316',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>문의하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#F97316" />
            </View>
          ) : (
            <View style={{ paddingTop: 80, alignItems: 'center', gap: 12 }}>
              <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>아직 문의 내역이 없어요.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
