import { FormEvent, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateReview } from '../api/transactions';
import { ScreenHeader } from '../components/ScreenHeader';

const MAX_RATING = 5;

export function ReviewCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const revieweeId = searchParams.get('revieweeId') ?? undefined;
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const createReview = useCreateReview(id);
  const canSubmit = !!revieweeId && rating >= 1 && rating <= MAX_RATING && !createReview.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!revieweeId || !canSubmit) return;
    setErrorMessage('');
    try {
      await createReview.mutateAsync({
        revieweeId,
        rating,
        content: content.trim() || undefined,
      });
      navigate(`/errands/${id}`, { replace: true });
    } catch {
      setErrorMessage(t('review.submitFailed'));
    }
  }

  return (
    <main>
      <ScreenHeader title={t('review.title')} back centered border />
      <form onSubmit={handleSubmit} className="grid gap-6 px-6 py-6">
        <section className="rounded-[20px] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <h1 className="mb-2 text-xl font-bold text-[#111827]">{t('review.ratingTitle')}</h1>
          <p className="mb-5 text-sm text-[#6B7280]">{t('review.ratingHelp')}</p>
          <div className="flex justify-center gap-2">
            {Array.from({ length: MAX_RATING }, (_, index) => {
              const value = index + 1;
              const selected = value <= rating;
              return (
                <button key={value} type="button" onClick={() => setRating(value)} className="text-[#F59E0B]" aria-label={t('review.ratingValue', { value })}>
                  <Star size={36} fill={selected ? 'currentColor' : 'none'} />
                </button>
              );
            })}
          </div>
        </section>

        <label className="grid gap-2 text-sm font-semibold text-[#111827]">
          {t('review.content')}
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-32 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-normal outline-none focus:border-[#F97316]"
            placeholder={t('review.contentPlaceholder')}
          />
        </label>

        {errorMessage ? <p className="text-sm font-semibold text-[#EF4444]">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-2xl bg-[#F97316] py-4 text-base font-bold text-white disabled:border disabled:border-[#F97316] disabled:bg-white disabled:text-[#F97316]"
        >
          {createReview.isPending ? t('review.submitting') : t('review.submit')}
        </button>
      </form>
    </main>
  );
}
