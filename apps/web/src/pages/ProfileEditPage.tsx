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
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setRole(profile.role ?? 'traveler');
    setSelectedAreas(profile.areas ?? []);
    setAvatarUrl(profile.avatarUrl ?? null);
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
      });
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      navigate('/my');
    } catch {
      setErrorMessage(t('my.profileSaveFailed'));
    } finally {
      setIsSubmitting(false);
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
