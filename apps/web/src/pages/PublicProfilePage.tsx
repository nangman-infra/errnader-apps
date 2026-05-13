import { Link, useLocation, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePublicUserProfile } from '../api/users';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';
import { ALL_AREAS } from '../constants/app';
import { PublicUserProfile } from '../types/domain';

function areaNames(areaIds: string[], t: (key: string) => string): string {
  const names = areaIds
    .map((id) => {
      const area = ALL_AREAS.find((item) => item.id === id);
      return area ? t(area.nameKey) : undefined;
    })
    .filter(Boolean)
    .map(String);
  return names.length > 0 ? names.join(' · ') : '';
}

export function PublicProfilePage() {
  const { t } = useTranslation();
  const { userId } = useParams();
  const location = useLocation();
  const routeState = location.state as { profileSeed?: PublicUserProfile } | null;
  const seedProfile = routeState?.profileSeed;
  const { data: fetchedProfile, isLoading, isError } = usePublicUserProfile(userId, !seedProfile);
  const profile = fetchedProfile ?? seedProfile;

  if (isLoading && !profile) {
    return (
      <main>
        <ScreenHeader title={t('profile.title')} back centered border />
        <StateBlock title={t('profile.loading')} />
      </main>
    );
  }

  if ((isError && !profile) || !profile) {
    return (
      <main>
        <ScreenHeader title={t('profile.title')} back centered border />
        <StateBlock title={t('profile.loadError')} description={t('my.authNetworkHelp')} />
      </main>
    );
  }

  const roleLabel = profile.role === 'errander' ? t('my.roleErrander') : t('my.roleTraveler');
  const ratingLabel = profile.averageRating === null ? '-' : profile.averageRating.toFixed(1);

  return (
    <main>
      <ScreenHeader title={t('profile.title')} back centered border />
      <section className="px-6 py-5">
        <div className="mb-3 rounded-[20px] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="mb-5 flex items-center gap-4">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="size-16 rounded-full object-cover" />
            ) : (
              <div className="grid size-16 place-items-center rounded-full bg-[#F97316] text-2xl font-bold text-white">
                {profile.initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-[#111827]">{profile.name}</h1>
              <p className="mt-1 text-sm text-[#6B7280]">{roleLabel}</p>
              <p className="mt-1 truncate text-xs text-[#9CA3AF]">{areaNames(profile.areas, t) || t('my.noAreas')}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 rounded-2xl bg-[#FFF9F4] px-3 py-4 text-center">
            <div>
              <p className="text-lg font-bold text-[#111827]">{profile.completedCount}</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">{t('profile.completed')}</p>
            </div>
            <div className="border-x border-[#FFE4CC]">
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-[#111827]">
                <Star size={16} fill="#F59E0B" className="text-[#F59E0B]" />
                {ratingLabel}
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">{t('profile.rating')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#111827]">{profile.reviewCount}</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">{t('profile.reviews')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <h2 className="mb-4 text-base font-bold text-[#111827]">{t('profile.recentReviews')}</h2>
          {profile.recentReviews.length === 0 ? (
            <StateBlock title={t('profile.noReviews')} />
          ) : (
            <div className="grid gap-4">
              {profile.recentReviews.map((review) => (
                <article key={review.reviewId} className="border-b border-[#F3F4F6] pb-4 last:border-b-0 last:pb-0">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <Link to={`/users/${review.reviewerId}`} className="truncate text-sm font-bold text-[#111827]">
                      {review.reviewerName}
                    </Link>
                    <span className="flex items-center gap-1 text-sm font-bold text-[#F59E0B]">
                      <Star size={14} fill="currentColor" />
                      {review.rating}
                    </span>
                  </div>
                  {review.content ? <p className="text-sm leading-5 text-[#6B7280]">{review.content}</p> : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
