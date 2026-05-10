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
  ActionSheetIOS,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client';
import { useCreateInquiry } from '../../hooks/useInquiries';

const INPUT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
} as const;

const MAX_CONTENT_LENGTH = 1000;
const MAX_PHOTOS = 3;

async function requestPermission(source: 'camera' | 'library'): Promise<boolean> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export function InquiryCreateScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { mutate: submit, isPending } = useCreateInquiry();

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  const pickAndUpload = async (source: 'camera' | 'library') => {
    const hasPermission = await requestPermission(source);
    if (!hasPermission) {
      Alert.alert('권한 필요', '설정에서 권한을 허용해주세요.');
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images' as any, quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images' as any, quality: 0.85 });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setIsUploading(true);
    try {
      const { data } = await apiClient.post('/errands/photos/presign', {
        fileName: asset.fileName ?? `inquiry_${Date.now()}.jpg`,
        contentType: asset.mimeType ?? 'image/jpeg',
      });
      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': asset.mimeType ?? 'image/jpeg' },
        body: await (await fetch(asset.uri)).blob(),
      });
      setPhotoUrls(prev => [...prev, data.publicUrl]);
    } catch {
      Alert.alert('오류', '사진 업로드에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const openPhotoPicker = () => {
    if (photoUrls.length >= MAX_PHOTOS) {
      Alert.alert('알림', `사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요.`);
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['취소', '즉시 촬영', '앨범에서 선택'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickAndUpload('camera');
          else if (idx === 2) pickAndUpload('library');
        },
      );
    } else {
      Alert.alert('사진 첨부', '', [
        { text: '취소', style: 'cancel' },
        { text: '즉시 촬영', onPress: () => pickAndUpload('camera') },
        { text: '앨범에서 선택', onPress: () => pickAndUpload('library') },
      ]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!isValid || isPending || isUploading) return;
    submit(
      { title: title.trim(), content: content.trim(), photoUrls },
      { onSuccess: () => router.back() },
    );
  };

  const isSubmitDisabled = !isValid || isPending || isUploading;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', flex: 1 }}>문의 작성</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 제목 */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>제목</Text>
          <View style={[{ backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }, INPUT_SHADOW]}>
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
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{content.length}/{MAX_CONTENT_LENGTH}</Text>
          </View>
          <View style={[{ backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }, INPUT_SHADOW]}>
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

          {/* 사진 첨부 */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            사진 첨부 <Text style={{ fontSize: 12, fontWeight: '400', color: '#9CA3AF' }}>(선택, 최대 {MAX_PHOTOS}장)</Text>
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
            {photoUrls.map((url, i) => (
              <View key={i} style={{ position: 'relative' }}>
                <Image source={{ uri: url }} style={{ width: 88, height: 88, borderRadius: 12 }} />
                <TouchableOpacity
                  onPress={() => removePhoto(i)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={13} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {photoUrls.length < MAX_PHOTOS && (
              <TouchableOpacity
                onPress={openPhotoPicker}
                disabled={isUploading}
                style={{ width: 88, height: 88, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#F97316" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>사진 추가</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            activeOpacity={0.8}
            style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: !isSubmitDisabled ? '#F97316' : '#D1D5DB' }}
          >
            {isPending || isUploading ? (
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
