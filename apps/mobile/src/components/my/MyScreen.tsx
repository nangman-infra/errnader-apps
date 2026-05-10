import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, router } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMyProfile } from '../../hooks/useMyProfile';
import { UserProfile } from '../../types/user';
import { clearTokens } from '../../api/tokenStorage';
import { apiClient } from '../../api/client';
import { CITIES } from '../../constants/areas';
import { LanguageSelectModal } from './LanguageSelectModal';
import { changeAppLanguage } from '../../i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
} as const;

export function MyScreen() {
  const { data: profile, isLoading, isError } = useMyProfile();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);

  const navigateToStart = () => {
    queryClient.clear();
    navigation.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'index' }] })
    );
  };

  const handleLogout = () => setConfirmVisible(true);

  const handleLogoutConfirm = async () => {
    setConfirmVisible(false);
    await clearTokens();
    navigateToStart();
  };

  const handleDeleteAccount = () => setDeleteConfirmVisible(true);

  const handleLanguageSelect = async (languageName: string) => {
    if (languageName === profile?.language) {
      setLanguageModalVisible(false);
      return;
    }
    setIsSavingLanguage(true);
    try {
      await apiClient.patch('/me', { language: languageName });
      await changeAppLanguage(languageName);
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setLanguageModalVisible(false);
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setDeleteConfirmVisible(false);
    await apiClient.delete('/me');
    await clearTokens();
    navigateToStart();
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>{t('my.profile_load_error')}</Text>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.75}
            style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FEE2E2' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>{t('my.logout')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFF9F4' }}>
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: '100%', backgroundColor: 'white', borderRadius: 24, padding: 28, ...CARD_SHADOW }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="exit-outline" size={24} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 }}>{t('my.logout_confirm_title')}</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 28 }}>{t('my.logout_confirm_message')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                activeOpacity={0.75}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogoutConfirm}
                activeOpacity={0.75}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>{t('my.logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: '100%', backgroundColor: 'white', borderRadius: 24, padding: 28, ...CARD_SHADOW }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 }}>{t('my.withdraw_confirm_title')}</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 28 }}>{t('my.withdraw_confirm_message')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.75}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccountConfirm}
                activeOpacity={0.75}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>{t('my.withdraw_action')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LanguageSelectModal
        visible={languageModalVisible}
        currentLanguage={profile?.language ?? '한국어'}
        isSaving={isSavingLanguage}
        onSelect={handleLanguageSelect}
        onClose={() => setLanguageModalVisible(false)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{t('my.title')}</Text>
        </View>

        <ProfileCard profile={profile} />

        <View
          style={[
            { marginHorizontal: 24, marginBottom: 12, backgroundColor: 'white', borderRadius: 20, padding: 20, flexDirection: 'row' },
            CARD_SHADOW,
          ]}
        >
          <StatItem label={t('my.stat_active')} value={String(profile.activeCount)} />
          <View style={{ width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 8 }} />
          <StatItem label={t('my.stat_completed')} value={String(profile.completedCount)} />
          <View style={{ width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 8 }} />
          <StatItem label={t('my.stat_total_spent')} value={profile.totalSpentLabel} highlight />
        </View>

        <View style={[{ marginHorizontal: 24, marginBottom: 12, backgroundColor: 'white', borderRadius: 20 }, CARD_SHADOW]}>
          <MenuItem
            icon="document-text-outline"
            label={t('my.menu_requests')}
            value={t('my.menu_requests_value', { count: profile.activeCount })}
            onPress={() => router.push('/my-errands')}
          />
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 }} />
          <MenuItem icon="card-outline" label={t('my.menu_payment')} value={profile.paymentMethod} />
        </View>

        <View style={[{ marginHorizontal: 24, marginBottom: 12, backgroundColor: 'white', borderRadius: 20 }, CARD_SHADOW]}>
          <MenuItem icon="globe-outline" label={t('my.menu_language')} value={profile.language} onPress={() => setLanguageModalVisible(true)} />
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 }} />
          <MenuItem icon="settings-outline" label={t('my.menu_settings')} />
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 }} />
          <MenuItem icon="help-circle-outline" label={t('my.menu_help')} />
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 }} />
          <MenuItem icon="chatbubble-ellipses-outline" label={t('my.menu_inquiry')} onPress={() => router.push('/inquiry')} />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.75}
          style={{ marginHorizontal: 24, marginBottom: 12, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF2F2' }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="exit-outline" size={18} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>{t('my.logout')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          activeOpacity={0.75}
          style={{ marginHorizontal: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Text style={{ fontSize: 13, color: '#9CA3AF', textDecorationLine: 'underline' }}>{t('my.withdraw')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileCard({ profile }: { profile: UserProfile }) {
  const { t } = useTranslation();
  const roleLabel = profile.role === 'errander' ? t('my.role_errander') : t('my.role_traveler');
  const allAreas = CITIES.flatMap((c) => c.areas);
  const areaNames = (profile.areas ?? []).map((id) => allAreas.find((a) => a.id === id)?.name).filter(Boolean);

  return (
    <View style={[{ marginHorizontal: 24, marginBottom: 12, backgroundColor: 'white', borderRadius: 20, padding: 20 }, CARD_SHADOW]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {profile.avatarUrl ? (
          <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden' }}>
            <TouchableOpacity onPress={() => router.push('/profile-edit')} activeOpacity={0.8}>
              <Image source={{ uri: profile.avatarUrl }} style={{ width: 56, height: 56 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{profile.initial}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 2 }}>{profile.name}</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{profile.email}</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t('my.joined_at')} {profile.joinedAt}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/profile-edit')}
          activeOpacity={0.7}
          style={{ padding: 8, borderRadius: 12, backgroundColor: '#F3F4F6' }}
        >
          <Ionicons name="pencil-outline" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t('my.profile_role')}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 2 }}>{roleLabel}</Text>
      </View>
      {areaNames.length > 0 && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>{t('my.profile_areas')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {areaNames.map((name) => (
              <View
                key={name}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#F97316' }}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function StatItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: highlight ? '#F97316' : '#111827', marginBottom: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, value, onPress }: { icon: IoniconName; label: string; value?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F0EB', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color="#6B7280" />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' }}>{label}</Text>
      {value && <Text style={{ fontSize: 13, color: '#9CA3AF', marginRight: 4 }}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}
