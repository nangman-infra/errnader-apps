import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client';
import { Country } from '../../constants/countries';
import { CountryPickerModal } from './CountryPickerModal';
import { AreaSelector } from './AreaSelector';

const BASE_URL = 'https://bj9l28xy18.execute-api.ap-northeast-2.amazonaws.com/dev';

async function getPresignedUrl(ext: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { data } = await apiClient.get(`/presigned-url?ext=${ext}`);
  return data;
}

async function uploadToS3(uploadUrl: string, uri: string, contentType: string): Promise<void> {
  const response = await fetch(uri);
  const blob = await response.blob();
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
}

export function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [role, setRole] = useState<'traveler' | 'errander' | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length > 0 && selectedCountry !== null && role !== null;

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진 접근 권한이 필요해요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    setIsUploadingPhoto(true);
    try {
      const { uploadUrl, publicUrl } = await getPresignedUrl(ext);
      await uploadToS3(uploadUrl, asset.uri, contentType);
      setAvatarUri(asset.uri);
      setAvatarPublicUrl(publicUrl);
    } catch {
      Alert.alert('업로드 실패', '사진 업로드에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.put('/me', {
        name: name.trim(),
        nationality: selectedCountry!.name,
        avatarUrl: avatarPublicUrl ?? undefined,
        role: role!,
        areas: selectedAreas,
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('오류', '프로필 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={{ paddingTop: 20, paddingBottom: 32 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 6 }}>프로필 설정</Text>
            <Text style={{ fontSize: 15, color: '#6B7280' }}>errander를 시작하기 전에 간단히 소개해주세요.</Text>
          </View>

          {/* 프로필 사진 */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <TouchableOpacity
              onPress={handlePickPhoto}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
              style={{ position: 'relative' }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={44} color="#D1D5DB" />
                </View>
              )}
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' }}>
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={{ marginTop: 10, fontSize: 13, color: '#9CA3AF' }}>프로필 사진 (선택)</Text>
          </View>

          {/* 이름 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
              이름 <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
              실명을 사용하면 심부름꾼과 더 신뢰감 있게 소통할 수 있어요.
            </Text>
            <View style={{ backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력해주세요"
                placeholderTextColor="#9CA3AF"
                style={{ fontSize: 16, color: '#111827' }}
                maxLength={30}
              />
            </View>
          </View>

          {/* 국적 */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              국적 <Text style={{ color: '#F97316' }}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setIsPickerOpen(true)}
              activeOpacity={0.8}
              style={{ backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
            >
              {selectedCountry ? (
                <>
                  <Text style={{ fontSize: 24 }}>{selectedCountry.flag}</Text>
                  <Text style={{ flex: 1, fontSize: 16, color: '#111827' }}>{selectedCountry.name}</Text>
                </>
              ) : (
                <Text style={{ flex: 1, fontSize: 16, color: '#9CA3AF' }}>국적을 선택해주세요</Text>
              )}
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* 역할 */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              역할 <Text style={{ color: '#F97316' }}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['traveler', 'errander'] as const).map((r) => {
                const selected = role === r;
                const label = r === 'traveler' ? '여행자' : '심부름꾼';
                const emoji = r === 'traveler' ? '✈️' : '🛵';
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 6,
                      backgroundColor: selected ? '#FFF7ED' : 'white',
                      borderWidth: 2, borderColor: selected ? '#F97316' : '#E5E7EB',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: selected ? '#F97316' : '#374151' }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 주 활동 지역 */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              주 활동 지역 <Text style={{ color: '#9CA3AF', fontWeight: '400' }}>(선택)</Text>
            </Text>
            <AreaSelector selected={selectedAreas} onChange={setSelectedAreas} />
          </View>

          {/* 시작하기 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting || isUploadingPhoto}
            activeOpacity={0.85}
            style={{ borderRadius: 18, paddingVertical: 18, alignItems: 'center', backgroundColor: isValid && !isSubmitting ? '#F97316' : '#D1D5DB' }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ fontSize: 17, fontWeight: '700', color: 'white' }}>errander 시작하기</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={isPickerOpen}
        selected={selectedCountry}
        onSelect={setSelectedCountry}
        onClose={() => setIsPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
