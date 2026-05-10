import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../constants/languages';

interface LanguageSelectModalProps {
  visible: boolean;
  currentLanguage: string;
  isSaving: boolean;
  onSelect: (languageName: string) => void;
  onClose: () => void;
}

export function LanguageSelectModal({
  visible,
  currentLanguage,
  isSaving,
  onSelect,
  onClose,
}: LanguageSelectModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36 }}>
          {/* 헤더 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' }}>{t('language.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* 구분선 */}
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 24, marginBottom: 8 }} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.name;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => onSelect(lang.name)}
                  disabled={isSaving}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    gap: 14,
                    backgroundColor: isSelected ? '#FFF7ED' : 'white',
                  }}
                >
                  <Text style={{ fontSize: 26 }}>{lang.flag}</Text>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: isSelected ? '600' : '400', color: isSelected ? '#F97316' : '#111827' }}>
                    {lang.name}
                  </Text>
                  {isSaving && isSelected ? (
                    <ActivityIndicator size="small" color="#F97316" />
                  ) : isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color="#F97316" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
