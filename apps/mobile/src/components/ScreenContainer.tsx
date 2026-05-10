import { ReactNode } from 'react';
import {
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  dismissKeyboard?: boolean;
}

export default function ScreenContainer({ children, dismissKeyboard = true }: ScreenContainerProps) {
  const inner = <View className="flex-1">{children}</View>;

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9F4]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {dismissKeyboard ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            {inner}
          </TouchableWithoutFeedback>
        ) : (
          inner
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
