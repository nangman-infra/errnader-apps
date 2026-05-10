import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useMyProfile } from '../../hooks/useMyProfile';
import { UserRole } from '../../types/user';
import { AreaSelector } from './AreaSelector';

async function getPresignedUrl(ext: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { data } = await apiClient.get(`/presigned-url?ext=${ext}`);
  return data;
}

async function uploadToS3(uploadUrl: string, uri: string, contentType: string): Promise<void> {
  const response = await fetch(uri);
  const blob = await response.blob();
  await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
}

export function ProfileEditScreen() {
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();

  const [name, setName] = useState(profile?.name ?? '');
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'traveler');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(profile?.areas ?? []);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUrl ?? null);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(profile?.avatarUrl ?? null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length > 0;

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
      Alert.alert('업로드 실패', '사진 업로드에 실패했어요.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch('/me', {
        name: name.trim(),
        nationality: profile?.language ?? '한국어',
        role,
        avatarUrl: avatarPublicUrl ?? undefined,
        areas: selectedAreas,
      });
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      router.back();
    } catch {
      Alert.alert('오류', '프로필 저장에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827' }}>프로필 수정</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* 프로필 사진 */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <TouchableOpacity onPress={handlePickPhoto} disabled={isUploadingPhoto} activeOpacity={0.8} style={{ position: 'relative' }}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>
                    {name.trim()[0]?.toUpperCase() ?? profile?.initial ?? '?'}
                  </Text>
                </View>
              )}
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' }}>
                {isUploadingPhoto ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="camera" size={16} color="white" />}
              </View>
            </TouchableOpacity>
          </View>

          {/* 닉네임 */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
              닉네임 <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
              실명 사용을 추천해요. 서로 소통할 때 신뢰성이 높아져요.
            </Text>
            <View style={{ backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="닉네임을 입력해주세요"
                placeholderTextColor="#9CA3AF"
                style={{ fontSize: 16, color: '#111827' }}
                maxLength={30}
              />
            </View>
          </View>

          {/* 역할 */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>역할</Text>
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

          {/* 저장 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting || isUploadingPhoto}
            activeOpacity={0.85}
            style={{ borderRadius: 18, paddingVertical: 18, alignItems: 'center', backgroundColor: isValid && !isSubmitting ? '#F97316' : '#D1D5DB' }}
          >
            {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text style={{ fontSize: 17, fontWeight: '700', color: 'white' }}>저장하기</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
