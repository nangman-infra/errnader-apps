import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useErrand } from '../api/errands';
import { useMyProfile } from '../api/profile';
import { useCreateChatRoom, useCreateCompletionRequest } from '../api/transactions';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';
import { STATUS_CONFIG } from '../constants/app';
import { getCategoryKey } from '../utils/translation';

export function ErrandDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: errand, isLoading, isError } = useErrand(id);
  const { data: profile } = useMyProfile();
  const createChatRoom = useCreateChatRoom();
  const createCompletionRequest = useCreateCompletionRequest(id);

  if (isLoading) {
    return (
      <main>
        <ScreenHeader title={t('errand.detailTitle')} back centered border />
        <StateBlock title={t('errand.detailLoading')} />
      </main>
    );
  }

  if (isError || !errand) {
    return (
      <main>
        <ScreenHeader title={t('errand.detailTitle')} back centered border />
        <StateBlock title={t('errand.detailLoadError')} />
      </main>
    );
  }

  const status = STATUS_CONFIG[errand.status] ?? STATUS_CONFIG.PENDING;
  const categoryKey = getCategoryKey(errand.category);
  const travelerId = errand.travelerId ?? errand.userId;
  const travelerName = errand.travelerName;
  const isOwner = profile?.id === travelerId;
  const canStartChat = !!profile && !isOwner && errand.status === 'PENDING';
  const canRequestCompletion = errand.status === 'CONFIRMED' || errand.status === 'ACCEPTED';
  const confirmedRevieweeId = profile?.id === travelerId ? errand.confirmedErranderId ?? errand.erranderId : travelerId;
  const canWriteReview = errand.status === 'COMPLETED' && !!confirmedRevieweeId && !(errand.reviewedUserIds ?? []).includes(confirmedRevieweeId);

  async function handleStartChat() {
    if (!id || !travelerId) return;
    const room = await createChatRoom.mutateAsync({ errandId: id, participantId: travelerId });
    navigate(`/chat/${room.roomId}`, { state: { participantName: travelerName, errandId: id, receiverId: travelerId } });
  }

  return (
    <main>
      <ScreenHeader title={t('errand.detailTitle')} back centered border />
      <section className="px-6 py-5">
        <div className="rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-semibold text-[#F97316]">{categoryKey ? t(categoryKey) : errand.category}</p>
              <h2 className="text-xl font-bold leading-7">{errand.title}</h2>
            </div>
            <span className="rounded-[10px] px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
              {t(status.labelKey)}
            </span>
          </div>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="mb-1 text-xs font-semibold text-[#9CA3AF]">{t('profile.traveler')}</dt>
              <dd>
                <Link
                  to={`/users/${travelerId}`}
                  state={{
                    profileSeed: {
                      id: travelerId,
                      name: errand.travelerName ?? t('profile.viewProfile'),
                      initial: (errand.travelerName ?? '?')[0],
                      role: 'traveler',
                      areas: [],
                      completedCount: 0,
                      averageRating: null,
                      reviewCount: 0,
                      recentReviews: [],
                    },
                  }}
                  className="font-semibold text-[#F97316]"
                >
                  {errand.travelerName ?? t('profile.viewProfile')}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold text-[#9CA3AF]">{t('errand.when')}</dt>
              <dd className="text-[#374151]">{errand.when}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-semibold text-[#9CA3AF]">{t('errand.where')}</dt>
              <dd className="text-[#374151]">{errand.where}</dd>
            </div>
            {errand.detail ? (
              <div>
                <dt className="mb-1 text-xs font-semibold text-[#9CA3AF]">{t('errand.detail')}</dt>
                <dd className="whitespace-pre-wrap leading-6 text-[#374151]">{errand.detail}</dd>
              </div>
            ) : null}
          </dl>
          {errand.photoUrls.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {errand.photoUrls.map((url) => (
                <img key={url} src={url} alt="" className="aspect-square rounded-2xl object-cover" />
              ))}
            </div>
          ) : null}
          {errand.confirmedPriceAmount || errand.confirmedScheduledAt || errand.confirmedPlace ? (
            <div className="mt-5 rounded-2xl bg-[#FFF9F4] p-4">
              <p className="mb-3 text-sm font-bold text-[#111827]">{t('transaction.confirmedTerms')}</p>
              {errand.confirmedPriceAmount ? <SummaryRow label={t('transaction.price')} value={`₩${errand.confirmedPriceAmount.toLocaleString()}`} /> : null}
              {errand.confirmedScheduledAt ? <SummaryRow label={t('transaction.schedule')} value={errand.confirmedScheduledAt} /> : null}
              {errand.confirmedPlace ? <SummaryRow label={t('transaction.place')} value={errand.confirmedPlace} /> : null}
            </div>
          ) : null}
          <div className="mt-5 grid gap-2">
            {canStartChat ? (
              <button
                type="button"
                onClick={handleStartChat}
                disabled={createChatRoom.isPending}
                className="rounded-2xl bg-[#F97316] py-3 text-sm font-bold text-white disabled:bg-[#E5E7EB]"
              >
                {createChatRoom.isPending ? t('transaction.openingChat') : t('transaction.chatWithTraveler')}
              </button>
            ) : null}
            {canRequestCompletion ? (
              <button
                type="button"
                onClick={() => createCompletionRequest.mutate()}
                disabled={createCompletionRequest.isPending}
                className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] py-3 text-sm font-bold text-[#F97316]"
              >
                {createCompletionRequest.isPending ? t('transaction.requestingCompletion') : t('transaction.requestCompletion')}
              </button>
            ) : null}
            {canWriteReview ? (
              <Link
                to={`/errands/${errand.errandId}/reviews/new?revieweeId=${confirmedRevieweeId}`}
                className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] py-3 text-center text-sm font-bold text-[#F97316]"
              >
                {t('review.write')}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-4 last:mb-0">
      <span className="shrink-0 text-xs text-[#9CA3AF]">{label}</span>
      <span className="min-w-0 flex-1 text-right text-xs font-semibold text-[#374151]">{value}</span>
    </div>
  );
}
