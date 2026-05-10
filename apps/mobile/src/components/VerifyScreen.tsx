import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenContainer from './ScreenContainer';
import { sendOtp, verifyOtp } from '../api/auth';
import { setTokens } from '../api/tokenStorage';
import { apiClient } from '../api/client';

const RESEND_TIMEOUT_S = 41;
const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(Array<string>(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT_S);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // 6자리 모두 입력 시 자동 검증
  useEffect(() => {
    if (!code.every(d => d !== '') || isVerifying) return;

    const entered = code.join('');
    setIsVerifying(true);

    verifyOtp(email, entered)
      .then(async ({ data }) => {
        await setTokens({ idToken: data.idToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
        try {
          const { data: profile } = await apiClient.get('/me');
          router.replace(profile?.name ? '/(tabs)' : '/profile-setup');
        } catch {
          router.replace('/profile-setup');
        }
      })
      .catch(() => {
        setHasError(true);
        setTimeout(() => {
          setCode(Array<string>(CODE_LENGTH).fill(''));
          setHasError(false);
          setIsVerifying(false);
          inputs.current[0]?.focus();
        }, 1000);
      });
  }, [code]);

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/[^0-9]/g, '');

    if (digits.length > 1) {
      // 붙여넣기: 기존 글자가 앞에 붙는 경우를 위해 마지막 CODE_LENGTH개 사용
      const pasted = digits.slice(-CODE_LENGTH);
      const newCode = Array<string>(CODE_LENGTH).fill('');
      pasted.split('').forEach((d, i) => { newCode[i] = d; });
      setCode(newCode);
      inputs.current[Math.min(pasted.length - 1, CODE_LENGTH - 1)]?.focus();
      return;
    }

    const digit = digits.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <ScreenContainer dismissKeyboard={false}>
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
        <Text className="text-[28px] font-bold text-gray-900 mb-2">
          인증코드 입력
        </Text>
        <Text className="text-sm text-gray-500 mb-10">
          보낸 곳: {email}
        </Text>

        {/* 6자리 입력 박스 */}
        <View className="flex-row gap-x-2 mb-12">
          {code.map((digit, i) => (
            <View key={i} className="flex-1">
              {/* 실제 TextInput — 투명 텍스트, 롱프레스·붙여넣기 툴팁 담당 */}
              <TextInput
                ref={el => { inputs.current[i] = el; }}
                value={digit}
                onChangeText={text => handleChange(text, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                onFocus={() => setFocusedIndex(i)}
                keyboardType="number-pad"
                autoFocus={i === 0}
                caretHidden
                className="h-14 rounded-xl"
                style={{ color: 'transparent', backgroundColor: 'transparent' }}
              />
              {/* 시각적 오버레이 — 상태 기반으로만 표시해 플래시 없음 */}
              <View
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                className={`rounded-xl items-center justify-center bg-white border ${
                  hasError
                    ? 'border-red-400'
                    : i === focusedIndex ? 'border-orange-500' : 'border-gray-200'
                }`}
              >
                <Text className="text-xl font-bold text-gray-900">{digit}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 오류 메시지 */}
        {hasError && (
          <Text className="text-center text-sm text-red-400 -mt-8 mb-4">
            인증코드가 올바르지 않아요.
          </Text>
        )}

        {/* 재발송 타이머 / 버튼 */}
        {resendTimer > 0 ? (
          <Text className="text-center text-sm text-gray-400">
            재발송 가능 {resendTimer}s
          </Text>
        ) : (
          <TouchableOpacity
            className="items-center"
            onPress={() => { sendOtp(email); setResendTimer(RESEND_TIMEOUT_S); }}
            activeOpacity={0.7}
          >
            <Text className="text-sm text-orange-500 font-semibold">재발송하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}
