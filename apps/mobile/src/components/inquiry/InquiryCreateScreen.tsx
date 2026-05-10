import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCreateInquiry } from '../../hooks/useInquiries';

const INPUT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
} as const;

const MAX_CONTENT_LENGTH = 1000;

export function InquiryCreateScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { mutate: submit, isPending } = useCreateInquiry();

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    submit(
      { title: title.trim(), content: content.trim() },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 16,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', flex: 1 }}>
            문의 작성
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 제목 */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            제목
          </Text>
          <View
            style={[
              {
                backgroundColor: 'white',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 20,
              },
              INPUT_SHADOW,
            ]}
          >
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="문의 제목을 입력해주세요"
              placeholderTextColor="#9CA3AF"
              style={{ fontSize: 15, color: '#111827' }}
              maxLength={100}
              returnKeyType="next"
            />
          </View>

          {/* 내용 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>내용</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </Text>
          </View>
          <View
            style={[
              {
                backgroundColor: 'white',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 32,
              },
              INPUT_SHADOW,
            ]}
          >
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="문의 내용을 자세히 입력해주세요"
              placeholderTextColor="#9CA3AF"
              style={{ fontSize: 15, color: '#111827', minHeight: 160, textAlignVertical: 'top' }}
              multiline
              maxLength={MAX_CONTENT_LENGTH}
            />
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isPending}
            activeOpacity={0.8}
            style={{
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              backgroundColor: isValid && !isPending ? '#F97316' : '#D1D5DB',
            }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>문의 제출하기</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
