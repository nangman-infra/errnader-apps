import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { useMyProfile } from '../api/profile';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';
import { ALL_AREAS } from '../constants/app';
import { UserRole } from '../types/domain';

export function ProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError } = useMyProfile();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('traveler');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingKakaopayQr, setIsUploadingKakaopayQr] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [roleChangedTo, setRoleChangedTo] = useState<UserRole | null>(null);
  const [lineId, setLineId] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [kakaopayQrUrl, setKakaopayQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setRole(profile.role ?? 'traveler');
    setSelectedAreas(profile.areas ?? []);
    setAvatarUrl(profile.avatarUrl ?? null);
    setLineId(profile.lineId ?? '');
    setWhatsappPhone(profile.whatsappPhone ?? '');
    setKakaopayQrUrl(profile.kakaopayQrUrl ?? null);
  }, [profile]);

  const isValid = name.trim().length > 0;

  function toggleArea(areaId: string) {
    setSelectedAreas((current) =>
      current.includes(areaId) ? current.filter((id) => id !== areaId) : [...current, areaId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await apiClient.patch('/me', {
        name: name.trim(),
        nationality: profile?.language ?? '한국어',
        role,
        avatarUrl: avatarUrl ?? undefined,
        areas: selectedAreas,
        lineId: lineId.trim(),
        whatsappPhone: whatsappPhone.trim(),
        kakaopayQrUrl: kakaopayQrUrl ?? '',
      });
      queryClient.setQueryData<import('../types/domain').UserProfile>(['myProfile'], (old) =>
        old ? { ...old, name: name.trim(), role, areas: selectedAreas, avatarUrl: avatarUrl ?? old.avatarUrl } : old,
      );
      void queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      if (role !== profile?.role) {
        setRoleChangedTo(role);
      } else {
        navigate('/my');
      }
    } catch {
      setErrorMessage(t('my.profileSaveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleKakaopayQrChange(file: File | undefined) {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    setIsUploadingKakaopayQr(true);
    setErrorMessage('');
    try {
      const { data } = await apiClient.get<{ uploadUrl: string; publicUrl: string }>(`/presigned-url?ext=${ext}`);
      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
      });
      setKakaopayQrUrl(data.publicUrl);
    } catch {
      setErrorMessage(t('my.photoUploadFailed'));
    } finally {
      setIsUploadingKakaopayQr(false);
    }
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    setIsUploadingPhoto(true);
    setErrorMessage('');
    try {
      const { data } = await apiClient.get<{ uploadUrl: string; publicUrl: string }>(`/presigned-url?ext=${ext}`);
      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
      });
      setAvatarUrl(data.publicUrl);
    } catch {
      setErrorMessage(t('my.photoUploadFailed'));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <ScreenHeader title={t('my.editProfile')} back centered border />
        <StateBlock title={t('home.profileLoading')} />
      </main>
    );
  }

  if (isError || !profile) {
    return (
      <main>
        <ScreenHeader title={t('my.editProfile')} back centered border />
        <StateBlock title={t('my.profileLoadError')} description={t('my.authNetworkHelp')} />
      </main>
    );
  }

  return (
    <main>
      {roleChangedTo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-[24px] bg-white px-6 py-7 shadow-xl">
            <p className="mb-2 text-center text-4xl">
              {roleChangedTo === 'errander' ? '🛵' : '✈️'}
            </p>
            <h2 className="mb-2 text-center text-lg font-bold text-[#111827]">
              {t('my.roleChangedTitle')}
            </h2>
            <p className="mb-6 text-center text-sm text-[#6B7280]">
              {t('my.roleChangedMessage', {
                role: roleChangedTo === 'errander' ? t('my.roleErrander') : t('my.roleTraveler'),
              })}
            </p>
            <button
              type="button"
              onClick={() => navigate('/my')}
              className="w-full rounded-2xl bg-[#F97316] py-4 text-base font-bold text-white"
            >
              {t('my.roleChangedConfirm')}
            </button>
          </div>
        </div>
      ) : null}
      <ScreenHeader title={t('my.editProfile')} back centered border />
      <form onSubmit={handleSubmit} className="px-6 pb-8 pt-7">
        <div className="mb-9 flex justify-center">
          <label className="relative cursor-pointer" aria-label={t('my.editProfile')}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-[100px] rounded-full object-cover" />
            ) : (
              <div className="grid size-[100px] place-items-center rounded-full bg-[#F97316] text-4xl font-bold text-white">
                {name.trim()[0]?.toUpperCase() ?? profile.initial ?? '?'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border-2 border-white bg-[#F97316] text-white">
              {isUploadingPhoto ? <span className="size-4 animate-spin rounded-full border-2 border-white/50 border-t-white" /> : <Camera size={16} />}
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={isUploadingPhoto}
              className="sr-only"
              onChange={(event) => handlePhotoChange(event.target.files?.[0])}
            />
          </label>
        </div>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-semibold text-[#374151]">
            {t('my.nickname')} <span className="text-[#EF4444]">*</span>
          </span>
          <span className="mb-2 block text-xs text-[#9CA3AF]">{t('my.nicknameHelp')}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={30}
            placeholder={t('my.nicknamePlaceholder')}
            className="w-full rounded-2xl border border-transparent bg-white px-4 py-3.5 text-base text-[#111827] shadow-[0_1px_4px_rgba(0,0,0,0.05)] outline-none focus:border-[#F97316]"
          />
        </label>

        <fieldset className="mb-10">
          <legend className="mb-2 text-sm font-semibold text-[#374151]">{t('my.role')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['traveler', 'errander'] as const).map((nextRole) => {
              const selected = role === nextRole;
              return (
                <button
                  key={nextRole}
                  type="button"
                  onClick={() => setRole(nextRole)}
                  className={`rounded-2xl border-2 px-4 py-4 text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)] ${
                    selected ? 'border-[#F97316] bg-[#FFF7ED] text-[#F97316]' : 'border-[#E5E7EB] bg-white text-[#374151]'
                  }`}
                >
                  <span className="mb-1 block text-2xl">{nextRole === 'traveler' ? '✈️' : '🛵'}</span>
                  <span className="text-sm font-semibold">
                    {nextRole === 'traveler' ? t('my.roleTraveler') : t('my.roleErrander')}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mb-10">
          <legend className="mb-2 text-sm font-semibold text-[#374151]">
            {t('my.activeAreas')} <span className="font-normal text-[#9CA3AF]">{t('common.optional')}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {ALL_AREAS.map((area) => {
              const selected = selectedAreas.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleArea(area.id)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${
                    selected ? 'border-[#F97316] bg-[#F97316] text-white' : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                  }`}
                >
                  {t(area.nameKey)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mb-10">
          <legend className="mb-1 text-sm font-semibold text-[#374151]">
            {t('my.paymentMethods')} <span className="font-normal text-[#9CA3AF]">{t('common.optional')}</span>
          </legend>
          <p className="mb-4 text-xs text-[#9CA3AF]">{t('my.paymentMethodsHelp')}</p>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                <span className="inline-block size-4 rounded-sm bg-[#00B900]" />
                LINE
              </span>
              <div className="flex items-center rounded-2xl border border-transparent bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)] focus-within:border-[#F97316]">
                <span className="shrink-0 text-sm text-[#9CA3AF]">ID: </span>
                <input
                  value={lineId}
                  onChange={(event) => setLineId(event.target.value)}
                  placeholder={t('my.lineIdPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                <span className="inline-block size-4 rounded-sm bg-[#25D366]" />
                WhatsApp
              </span>
              <div className="flex items-center rounded-2xl border border-transparent bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)] focus-within:border-[#F97316]">
                <span className="shrink-0 text-sm text-[#9CA3AF]">+</span>
                <input
                  value={whatsappPhone}
                  onChange={(event) => setWhatsappPhone(event.target.value)}
                  inputMode="tel"
                  placeholder={t('my.whatsappPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none"
                />
              </div>
            </label>
            <div>
              <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
                <span className="inline-block size-4 rounded-sm bg-[#FAE100]" />
                KakaoPay
              </span>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                {kakaopayQrUrl ? (
                  <img src={kakaopayQrUrl} alt="KakaoPay QR" className="size-12 rounded-lg object-cover" />
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#FAF9F3] text-[#9CA3AF]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3v3M14 17h.01M20 14h.01"/></svg>
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
                  onChange={(event) => handleKakaopayQrChange(event.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </fieldset>

        {errorMessage ? <p className="mb-4 text-sm font-semibold text-[#EF4444]">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={!isValid || isSubmitting || isUploadingPhoto}
          className="w-full rounded-[18px] bg-[#F97316] py-[18px] text-[17px] font-bold text-white disabled:bg-[#D1D5DB]"
        >
          {isSubmitting ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </main>
  );
}
