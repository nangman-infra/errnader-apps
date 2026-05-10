import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { ErrandFormData, PhotoItem, WhenOption } from '../../types/errand';
import { apiClient } from '../../api/client';
import { CITIES } from '../../constants/areas';

const WHEN_OPTIONS: { id: WhenOption; label: string }[] = [
  { id: 'now', label: '지금 바로' },
  { id: 'today', label: '오늘' },
  { id: 'tomorrow', label: '내일' },
  { id: 'custom', label: '날짜 선택' },
];

const WHEN_DISPLAY: Record<WhenOption, string> = {
  now: 'now',
  today: '오늘',
  tomorrow: '내일',
  custom: '날짜 선택',
};

const TOTAL_STEPS = 4;

function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}

function getWhenDisplay(formData: ErrandFormData): string {
  if (formData.when === 'custom' && formData.customDate) {
    return formatDate(formData.customDate);
  }
  return WHEN_DISPLAY[formData.when];
}

export function ErrandRequestScreen() {
  const { what: prefilledWhat } = useLocalSearchParams<{ what?: string }>();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ErrandFormData>({
    what: prefilledWhat ?? '',
    when: 'now',
    customDate: undefined,
    areaId: undefined,
    where: '',
    photos: [],
  });

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    } else {
      const stillUploading = formData.photos.some(p => p.isUploading);
      if (stillUploading) {
        Alert.alert('업로드 중', '사진 업로드가 완료될 때까지 기다려주세요.');
        return;
      }
      try {
        const photoUrls = formData.photos
          .map(p => p.publicUrl)
          .filter(Boolean) as string[];
        await apiClient.post('/errands', {
          title: formData.what,
          category: prefilledWhat ?? 'other',
          when: formData.when === 'custom' && formData.customDate
            ? formatDate(formData.customDate)
            : WHEN_DISPLAY[formData.when],
          areaId: formData.areaId,
          where: formData.where,
          photoUrls,
        });
        router.replace('/(tabs)');
      } catch {
        Alert.alert('오류', '심부름 등록에 실패했어요. 다시 시도해주세요.');
      }
    }
  };

  const isNextEnabled = (() => {
    if (step === 1) return !formData.photos.some(p => p.isUploading);
    if (step === 2 && formData.when === 'custom') return !!formData.customDate;
    if (step === 3) return !!formData.areaId;
    if (step === 4) return !formData.photos.some(p => p.isUploading);
    return true;
  })();

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#FFF9F4]">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text className="text-base font-medium text-gray-600">
          {step} / {TOTAL_STEPS}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      {/* 진행 바 */}
      <View className="flex-row px-4 gap-x-1.5 mb-8">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            className="flex-1 rounded-full"
            style={{ height: 4, backgroundColor: i < step ? '#F97316' : '#E5E7EB' }}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <Step1What
              value={formData.what}
              onChange={v => setFormData(d => ({ ...d, what: v }))}
              photos={formData.photos}
              onPhotosChange={photos => setFormData(d => ({ ...d, photos }))}
            />
          )}
          {step === 2 && (
            <Step2When
              selected={formData.when}
              onSelect={v => setFormData(d => ({ ...d, when: v }))}
              customDate={formData.customDate}
              onCustomDateChange={date => setFormData(d => ({ ...d, customDate: date }))}
            />
          )}
          {step === 3 && (
            <Step3Where
              areaId={formData.areaId}
              onAreaSelect={id => setFormData(d => ({ ...d, areaId: id }))}
              where={formData.where}
              onWhereChange={v => setFormData(d => ({ ...d, where: v }))}
            />
          )}
          {step === 4 && <Step4Confirm formData={formData} />}
        </ScrollView>

        {/* 하단 버튼 */}
        <View className="px-6 pb-6 pt-4">
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isNextEnabled}
            activeOpacity={0.85}
            className="py-4 rounded-2xl items-center justify-center"
            style={
              isNextEnabled
                ? { backgroundColor: '#F97316' }
                : { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#F97316' }
            }
          >
            <Text
              className="text-base font-bold"
              style={{ color: isNextEnabled ? 'white' : '#F97316' }}
            >
              {step === TOTAL_STEPS ? '심부름 등록' : '다음'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const MAX_PHOTOS = 5;

async function requestMediaPermission(type: 'camera' | 'library'): Promise<boolean> {
  if (type === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

async function uploadPhotoToS3(localUri: string): Promise<string | null> {
  try {
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { data } = await apiClient.post<{ uploadUrl: string; publicUrl: string }>(
      '/errands/photos/presign',
      { contentType }
    );
    const blob = await fetch(localUri).then(r => r.blob());
    await fetch(data.uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': contentType },
    });
    return data.publicUrl;
  } catch {
    return null;
  }
}

function Step1What({
  value,
  onChange,
  photos,
  onPhotosChange,
}: {
  value: string;
  onChange: (v: string) => void;
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
}) {
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  const pickAndUpload = async (source: 'camera' | 'library') => {
    setSourceModalVisible(false);
    const hasPermission = await requestMediaPermission(source);
    if (!hasPermission) {
      Alert.alert('권한 필요', '사진 접근 권한이 필요해요.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85, allowsMultipleSelection: false });

    if (result.canceled || !result.assets?.[0]) return;

    const localUri = result.assets[0].uri;
    const newItem: PhotoItem = {
      id: `${Date.now()}`,
      localUri,
      publicUrl: null,
      isUploading: true,
    };

    const withNew = [...photos, newItem];
    onPhotosChange(withNew);

    const publicUrl = await uploadPhotoToS3(localUri);

    if (!publicUrl) {
      Alert.alert('업로드 실패', '사진 업로드에 실패했어요. 다시 시도해주세요.');
      onPhotosChange(withNew.filter(p => p.id !== newItem.id));
    } else {
      onPhotosChange(withNew.map(p =>
        p.id === newItem.id ? { ...p, isUploading: false, publicUrl } : p
      ));
    }
  };

  const removePhoto = (id: string) => {
    onPhotosChange(photos.filter(p => p.id !== id));
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-1">무엇이 필요하세요?</Text>
      <Text className="text-sm text-gray-500 mb-6">
        한 줄로 알려주세요. 심부름꾼이 추가로 여쭤볼게요.
      </Text>
      <View
        className="bg-white rounded-2xl px-4 py-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
          minHeight: 140,
        }}
      >
        <TextInput
          multiline
          value={value}
          onChangeText={onChange}
          placeholder="예: 인사동 저녁 7시 2인 식당 예약"
          placeholderTextColor="#9CA3AF"
          className="text-sm text-gray-700"
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        {photos.length > 0 && (
          <PhotoPreviewStrip photos={photos} onRemove={removePhoto} />
        )}

        <TouchableOpacity
          onPress={() => {
            if (photos.length >= MAX_PHOTOS) {
              Alert.alert('최대 5장', '사진은 최대 5장까지 첨부할 수 있어요.');
              return;
            }
            setSourceModalVisible(true);
          }}
          activeOpacity={0.75}
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
            backgroundColor: '#FFF7ED',
            borderWidth: 1,
            borderColor: '#FED7AA',
          }}
        >
          <Ionicons name="camera-outline" size={16} color="#F97316" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#F97316' }}>
            사진 첨부 {photos.length > 0 ? `(${photos.length}/${MAX_PHOTOS})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <PhotoSourceModal
        visible={sourceModalVisible}
        onClose={() => setSourceModalVisible(false)}
        onSelect={pickAndUpload}
      />
    </View>
  );
}

function PhotoPreviewStrip({ photos, onRemove }: { photos: PhotoItem[]; onRemove: (id: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 12 }}
      contentContainerStyle={{ gap: 8 }}
    >
      {photos.map(photo => (
        <View
          key={photo.id}
          style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F3F4F6' }}
        >
          <Image source={{ uri: photo.localUri }} style={{ width: 72, height: 72 }} />
          {photo.isUploading && (
            <View
              style={{
                position: 'absolute', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
          {!photo.isUploading && (
            <TouchableOpacity
              onPress={() => onRemove(photo.id)}
              style={{
                position: 'absolute', top: 3, right: 3,
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: 'rgba(0,0,0,0.55)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={12} color="white" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function PhotoSourceModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: 'camera' | 'library') => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 40,
          gap: 12,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>사진 추가</Text>
        <TouchableOpacity
          onPress={() => onSelect('camera')}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            padding: 16, borderRadius: 16, backgroundColor: '#F9FAFB',
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera-outline" size={20} color="#F97316" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>즉시 촬영</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSelect('library')}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            padding: 16, borderRadius: 16, backgroundColor: '#F9FAFB',
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="images-outline" size={20} color="#F97316" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>앨범에서 선택</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.75}
          style={{ padding: 14, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', marginTop: 4 }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>취소</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function Step2When({
  selected,
  onSelect,
  customDate,
  onCustomDateChange,
}: {
  selected: WhenOption;
  onSelect: (v: WhenOption) => void;
  customDate?: Date;
  onCustomDateChange: (date: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-1">언제 필요하세요?</Text>
      <Text className="text-sm text-gray-500 mb-6">
        한 줄로 알려주세요. 심부름꾼이 추가로 여쭤볼게요.
      </Text>
      <View className="gap-y-3">
        {WHEN_OPTIONS.map(option => {
          const isSelected = option.id === selected;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => onSelect(option.id)}
              activeOpacity={0.75}
              className="rounded-2xl px-5 py-4"
              style={
                isSelected
                  ? { backgroundColor: '#FFF7ED', borderWidth: 1.5, borderColor: '#F97316' }
                  : { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' }
              }
            >
              <Text
                className="text-base font-medium"
                style={{ color: isSelected ? '#EA580C' : '#374151' }}
              >
                {option.id === 'custom' && customDate
                  ? formatDate(customDate)
                  : option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 날짜 선택 시 달력 표시 */}
      {selected === 'custom' && (
        <View style={{ marginTop: 16 }}>
          <DateTimePicker
            value={customDate ?? today}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_event, selectedDate) => {
              if (selectedDate) onCustomDateChange(selectedDate);
            }}
            minimumDate={today}
            accentColor="#F97316"
            themeVariant="light"
          />
        </View>
      )}
    </View>
  );
}

const ALL_AREAS = CITIES.flatMap(c => c.areas);

function Step3Where({
  areaId,
  onAreaSelect,
  where,
  onWhereChange,
}: {
  areaId: string | undefined;
  onAreaSelect: (id: string) => void;
  where: string;
  onWhereChange: (v: string) => void;
}) {
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-1">어디서요?</Text>
      <Text className="text-sm text-gray-500 mb-6">심부름꾼이 어디로 가야 할까요?</Text>

      {/* 지역 선택 */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 }}>
        지역 선택 <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {ALL_AREAS.map(area => {
          const isSelected = areaId === area.id;
          return (
            <TouchableOpacity
              key={area.id}
              onPress={() => onAreaSelect(area.id)}
              activeOpacity={0.75}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isSelected ? '#FFF7ED' : 'white',
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected ? '#F97316' : '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#EA580C' : '#4B5563' }}>
                {area.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 상세 위치 */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
        상세 위치 <Text style={{ fontSize: 12, fontWeight: '400', color: '#9CA3AF' }}>(선택)</Text>
      </Text>
      <View
        className="bg-white rounded-2xl px-4 py-3.5"
        style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
      >
        <TextInput
          value={where}
          onChangeText={onWhereChange}
          placeholder="구체적인 장소나 주소를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="text-sm text-gray-700"
        />
      </View>
    </View>
  );
}

function Step4Confirm({ formData }: { formData: ErrandFormData }) {
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-1">확인</Text>
      <Text className="text-sm text-gray-500 mb-6">몇 분 안에 매칭해 드릴게요.</Text>

      {/* 요약 카드 */}
      <View
        className="bg-white rounded-2xl px-5 py-4 mb-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <SummaryRow label="무엇이 필요하세요" value={formData.what || '—'} />
        <View className="h-px bg-gray-100 my-3" />
        <SummaryRow label="언제 필요하세요" value={getWhenDisplay(formData)} />
        <View className="h-px bg-gray-100 my-3" />
        <SummaryRow
          label="어디서요"
          value={[
            ALL_AREAS.find(a => a.id === formData.areaId)?.name,
            formData.where || undefined,
          ].filter(Boolean).join(' · ') || '—'}
        />
        {formData.photos.length > 0 && (
          <>
            <View className="h-px bg-gray-100 my-3" />
            <View>
              <Text className="text-xs text-gray-400 mb-2">첨부 사진 ({formData.photos.length}장)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {formData.photos.map(photo => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.localUri }}
                    style={{ width: 56, height: 56, borderRadius: 8 }}
                  />
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </View>

      {/* 예산 카드 */}
      <View className="rounded-2xl px-5 py-4" style={{ backgroundColor: '#FEFCE8' }}>
        <View className="flex-row items-center gap-x-1 mb-1">
          <Text>✨</Text>
          <Text className="text-sm font-bold text-gray-900">예산</Text>
        </View>
        <Text className="text-xs text-gray-500 mb-2">
          심부름꾼 수고비 + 서비스. 완료 후 결제해요.
        </Text>
        <Text className="text-lg font-bold text-gray-900">₩18,000 – 25,000</Text>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-start gap-x-4">
      <Text className="text-xs text-gray-400 flex-shrink-0">{label}</Text>
      <Text className="text-xs text-gray-700 text-right flex-1" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
