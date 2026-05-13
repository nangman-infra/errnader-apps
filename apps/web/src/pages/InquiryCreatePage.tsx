import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateInquiry } from '../api/inquiries';
import { ScreenHeader } from '../components/ScreenHeader';

export function InquiryCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createInquiry = useCreateInquiry();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !createInquiry.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await createInquiry.mutateAsync({ title: title.trim(), content: content.trim(), photoUrls: [] });
    navigate('/my/inquiries', { replace: true });
  }

  return (
    <main>
      <ScreenHeader title={t('inquiry.createTitle')} back centered border />
      <form onSubmit={handleSubmit} className="grid gap-5 px-6 py-5">
        <label className="grid gap-2 text-sm font-semibold">
          {t('inquiry.titleLabel')}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-normal outline-none focus:border-[#F97316]"
            placeholder={t('inquiry.titlePlaceholder')}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          {t('inquiry.contentLabel')}
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-40 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-normal outline-none focus:border-[#F97316]"
            placeholder={t('inquiry.contentPlaceholder')}
          />
        </label>
        {createInquiry.isError ? <p className="text-sm font-semibold text-[#EF4444]">{t('inquiry.submitFailed')}</p> : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-2xl bg-[#F97316] py-4 text-base font-bold text-white disabled:border disabled:border-[#F97316] disabled:bg-white disabled:text-[#F97316]"
        >
          {createInquiry.isPending ? t('inquiry.submitting') : t('inquiry.submit')}
        </button>
      </form>
    </main>
  );
}
