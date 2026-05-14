import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, CreditCard, FileText, Globe2, LogOut, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { useMyProfile } from '../api/profile';
import { clearAuthTokens } from '../api/tokenStorage';
import { LanguageSelectModal } from '../components/LanguageSelectModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';
import { ALL_AREAS } from '../constants/app';
import { changeAppLanguage } from '../i18n';

function areaNames(areaIds: string[] | undefined, t: (key: string) => string): string {
  const names = (areaIds ?? [])
    .map((id) => {
      const area = ALL_AREAS.find((item) => item.id === id);
      return area ? t(area.nameKey) : undefined;
    })
    .filter(Boolean)
    .map(String);
  return names.length > 0 ? names.join(' · ') : '';
}

export function MyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError } = useMyProfile();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isPaymentPanelOpen, setIsPaymentPanelOpen] = useState(false);
  const [lineId, setLineId] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [kakaopayQrUrl, setKakaopayQrUrl] = useState<string | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isUploadingKakaopayQr, setIsUploadingKakaopayQr] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLineId(profile.lineId ?? '');
    setWhatsappPhone(profile.whatsappPhone ?? '');
    setKakaopayQrUrl(profile.kakaopayQrUrl ?? null);
  }, [profile]);

  function handleLogout() {
    clearAuthTokens();
    navigate('/login', { replace: true });
  }

  async function handleDeleteAccount() {
    await apiClient.delete('/me');
    clearAuthTokens();
    navigate('/login', { replace: true });
  }

  async function handleSavePayment() {
    if (isSavingPayment) return;
    setIsSavingPayment(true);
    try {
      await apiClient.patch('/me', {
        lineId: lineId.trim(),
        whatsappPhone: whatsappPhone.trim(),
        kakaopayQrUrl: kakaopayQrUrl ?? '',
      });
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setIsPaymentPanelOpen(false);
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function handleKakaopayQrChange(file: File | undefined) {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    setIsUploadingKakaopayQr(true);
    try {
      const { data } = await apiClient.get<{ uploadUrl: string; publicUrl: string }>(`/presigned-url?ext=${ext}`);
      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
      });
      setKakaopayQrUrl(data.publicUrl);
    } finally {
      setIsUploadingKakaopayQr(false);
    }
  }

  async function handleLanguageSelect(languageName: string) {
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
  }

  if (isLoading) {
    return (
      <main>
        <ScreenHeader title={t('my.title')} />
        <StateBlock title={t('home.profileLoading')} />
      </main>
    );
  }

  if (isError || !profile) {
    return (
      <main>
        <ScreenHeader title={t('my.title')} />
        <StateBlock title={t('my.profileLoadError')} description={t('my.authNetworkHelp')} />
      </main>
    );
  }

  const roleLabel = profile.role === 'errander' ? t('my.roleErrander') : t('my.roleTraveler');

  return (
    <main>
      <LanguageSelectModal
        visible={languageModalVisible}
        currentLanguage={profile.language ?? '한국어'}
        isSaving={isSavingLanguage}
        onSelect={handleLanguageSelect}
        onClose={() => setLanguageModalVisible(false)}
      />
      <ScreenHeader title={t('my.title')} />
      <section className="px-6 py-5">
        <div className="mb-3 rounded-[20px] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="size-14 rounded-full object-cover" />
            ) : (
              <div className="grid size-14 place-items-center rounded-full bg-[#F97316] text-xl font-bold text-white">
                {profile.initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold">{profile.name}</h2>
              <p className="truncate text-sm text-[#6B7280]">{profile.email}</p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {roleLabel} · {areaNames(profile.areas, t) || t('my.noAreas')}
              </p>
            </div>
            <Link
              to="/profile/edit"
              aria-label={t('my.editProfile')}
              className="grid size-9 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
            >
              <Pencil size={16} />
            </Link>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 rounded-[20px] bg-white p-5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div>
            <p className="text-lg font-bold">{profile.activeCount}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">{t('my.active')}</p>
          </div>
          <div className="border-l border-[#F3F4F6]">
            <p className="text-lg font-bold">{profile.completedCount}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">{t('my.completed')}</p>
          </div>
        </div>

        <div className="mb-3 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <Link to="/my/errands" className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
            <span className="flex items-center gap-3 font-semibold"><FileText size={20} className="text-[#F97316]" />{t('my.myErrands')}</span>
            <span className="text-sm text-[#9CA3AF]">{t('my.activeCount', { count: profile.activeCount })}</span>
          </Link>
          <div>
            <button
              type="button"
              onClick={() => setIsPaymentPanelOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="flex items-center gap-3 font-semibold">
                <CreditCard size={20} className="text-[#F97316]" />
                {t('my.paymentMethod')}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
                {[lineId, whatsappPhone, kakaopayQrUrl].filter(Boolean).length > 0
                  ? `${[lineId, whatsappPhone, kakaopayQrUrl].filter(Boolean).length}${t('my.paymentMethodCount')}`
                  : t('my.paymentMethodNone')}
                {isPaymentPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
            {isPaymentPanelOpen ? (
              <div className="border-t border-[#F3F4F6] px-5 pb-4 pt-3">
                <div className="grid gap-3">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                      <span className="inline-block size-3.5 rounded-sm bg-[#00B900]" />
                      LINE
                    </span>
                    <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 focus-within:border-[#F97316]">
                      <span className="shrink-0 text-sm text-[#9CA3AF]">ID: </span>
                      <input
                        value={lineId}
                        onChange={(e) => setLineId(e.target.value)}
                        placeholder={t('my.lineIdPlaceholder')}
                        className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                      <span className="inline-block size-3.5 rounded-sm bg-[#25D366]" />
                      WhatsApp
                    </span>
                    <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 focus-within:border-[#F97316]">
                      <span className="shrink-0 text-sm text-[#9CA3AF]">+</span>
                      <input
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        inputMode="tel"
                        placeholder={t('my.whatsappPlaceholder')}
                        className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
                      />
                    </div>
                  </label>
                  <div>
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                      <span className="inline-block size-3.5 rounded-sm bg-[#FAE100]" />
                      KakaoPay
                    </span>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5">
                      {kakaopayQrUrl ? (
                        <img src={kakaopayQrUrl} alt="KakaoPay QR" className="size-10 rounded-lg object-cover" />
                      ) : (
                        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F3F4F6] text-[#9CA3AF]">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3v3M14 17h.01M20 14h.01"/></svg>
                        </div>
                      )}
                      <span className="text-sm text-[#6B7280]">
                        {isUploadingKakaopayQr ? t('my.uploadingQr') : kakaopayQrUrl ? t('my.changeQr') : t('my.uploadKakaopayQr')}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingKakaopayQr}
                        className="sr-only"
                        onChange={(e) => handleKakaopayQrChange(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={isSavingPayment}
                  className="mt-4 w-full rounded-xl bg-[#F97316] py-2.5 text-sm font-bold text-white disabled:bg-[#E5E7EB]"
                >
                  {isSavingPayment ? t('common.saving') : t('common.save')}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-3 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => setLanguageModalVisible(true)}
            className="flex w-full items-center justify-between border-b border-[#F3F4F6] px-5 py-4 text-left"
          >
            <span className="flex items-center gap-3 font-semibold"><Globe2 size={20} className="text-[#F97316]" />{t('my.language')}</span>
            <span className="text-sm text-[#9CA3AF]">{profile.language}</span>
          </button>
          <Link to="/my/inquiries" className="flex items-center justify-between px-5 py-4">
            <span className="flex items-center gap-3 font-semibold"><MessageCircle size={20} className="text-[#F97316]" />{t('my.inquiry')}</span>
            <span className="text-sm text-[#D1D5DB]">›</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mb-3 flex w-full items-center gap-3 rounded-[20px] bg-[#FEF2F2] px-5 py-[18px] text-left font-semibold text-[#EF4444]"
        >
          <LogOut size={20} />
          {t('my.logout')}
        </button>
        <button type="button" onClick={handleDeleteAccount} className="flex items-center gap-2 px-1 py-3 text-sm text-[#9CA3AF] underline">
          <Trash2 size={14} />
          {t('my.withdraw')}
        </button>
      </section>
    </main>
  );
}
