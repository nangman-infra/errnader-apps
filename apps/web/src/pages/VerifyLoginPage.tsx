import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { sendOtp, verifyOtp } from '../api/auth';
import { fetchMyProfile } from '../api/profile';
import { setAuthTokens } from '../api/tokenStorage';
import { isProfileComplete } from '../utils/profile';

const CODE_LENGTH = 6;

export function VerifyLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get('email') ?? '', [searchParams]);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const canSubmit = code.length === CODE_LENGTH && !!email && !isVerifying;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsVerifying(true);
    setErrorMessage('');
    try {
      const { data } = await verifyOtp(email, code);
      setAuthTokens({
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });

      try {
        const profile = await fetchMyProfile();
        navigate(isProfileComplete(profile) ? '/' : '/profile/setup', { replace: true });
      } catch (profileError) {
        if (isAxiosError(profileError) && profileError.response?.status === 404) {
          navigate('/profile/setup', { replace: true });
          return;
        }

        navigate('/', { replace: true });
      }
    } catch {
      setErrorMessage(t('auth.invalidCode'));
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    await sendOtp(email);
  }

  return (
    <main className="min-h-dvh bg-[#FFF9F4] px-6 pt-16 text-[#111827]">
      <button type="button" onClick={() => navigate(-1)} className="mb-8 text-3xl text-[#1C1C1E]" aria-label={t('common.back')}>
        ‹
      </button>
      <h1 className="mb-2 text-[28px] font-bold">{t('auth.verifyTitle')}</h1>
      <p className="mb-10 text-sm text-[#6B7280]">{t('auth.sentTo', { email })}</p>
      <form onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
          inputMode="numeric"
          autoComplete="one-time-code"
          className="mb-4 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.4em] text-[#111827] outline-none focus:border-[#F97316]"
          placeholder="000000"
        />
        {errorMessage ? <p className="mb-4 text-center text-sm text-[#EF4444]">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="mb-4 w-full rounded-2xl bg-[#F97316] py-4 text-base font-bold text-white disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
        >
          {isVerifying ? t('auth.verifying') : t('auth.login')}
        </button>
        <button type="button" onClick={handleResend} className="w-full py-3 text-sm font-semibold text-[#F97316]">
          {t('auth.resend')}
        </button>
      </form>
    </main>
  );
}
