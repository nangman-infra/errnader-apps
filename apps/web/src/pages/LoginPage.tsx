import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sendOtp } from '../api/auth';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isValid = email.includes('@') && email.includes('.');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      await sendOtp(email);
      navigate(`/login/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setErrorMessage(t('auth.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#FFF9F4] px-6 pt-20 text-[#111827]">
      <div className="mb-24 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-[#F97316] text-xl font-bold text-white">e</div>
        <p className="text-base font-semibold">errander</p>
      </div>
      <h1 className="mb-2 text-[28px] font-bold">{t('auth.emailTitle')}</h1>
      <p className="mb-8 text-sm text-[#6B7280]">{t('auth.emailSubtitle')}</p>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="you@email.com"
          className="mb-3 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 text-base text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F97316]"
        />
        <p className="mb-8 text-xs text-[#9CA3AF]">{t('auth.terms')}</p>
        {errorMessage ? <p className="mb-4 text-sm font-semibold text-[#EF4444]">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full rounded-2xl bg-[#F97316] py-4 text-base font-bold text-white disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
        >
          {isLoading ? t('auth.sending') : t('auth.continue')}
        </button>
      </form>
    </main>
  );
}
