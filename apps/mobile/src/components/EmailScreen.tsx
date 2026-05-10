import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import ScreenContainer from './ScreenContainer';
import { sendOtp } from '../api/auth';

export default function EmailScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = email.includes('@') && email.includes('.');

  const handleContinue = async () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    try {
      await sendOtp(email);
      router.push({ pathname: '/verify', params: { email } });
    } catch {
      Alert.alert('오류', '인증 메일 발송에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      {/* 뒤로가기 */}
      <TouchableOpacity
        className="px-5 pt-2 pb-4"
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text className="text-2xl text-gray-800">‹</Text>
      </TouchableOpacity>

      <View className="flex-1 px-6">
        {/* 헤더 */}
        <Text className="text-[28px] font-bold text-gray-900 mb-2">
          이메일을 알려주세요
        </Text>
        <Text className="text-sm text-gray-500 mb-8">
          6자리 인증코드를 보내드려요.
        </Text>

        {/* 이메일 입력 */}
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 bg-white mb-3"
          placeholder="you@email.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />

        {/* 약관 안내 */}
        <Text className="text-xs text-gray-400 mb-8">
          계속하면 이용약관 및 개인정보처리방침에 동의하게 돼요.
        </Text>

        {/* 계속하기 버튼 */}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${isValid ? 'bg-orange-500' : 'bg-gray-200'}`}
          activeOpacity={isValid ? 0.85 : 1}
          disabled={!isValid || isLoading}
          onPress={handleContinue}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold text-base ${isValid ? 'text-white' : 'text-gray-400'}`}>
              계속하기
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
