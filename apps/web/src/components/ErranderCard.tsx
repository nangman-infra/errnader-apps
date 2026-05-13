import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BadgeType, Errander } from '../types/domain';

const BADGE_CONFIG: Record<BadgeType, { labelKey: string; bg: string; color: string }> = {
  popular: { labelKey: 'erranderList.badges.popular', bg: '#FFEDD5', color: '#EA580C' },
  fast_response: { labelKey: 'erranderList.badges.fastResponse', bg: '#FEE2E2', color: '#DC2626' },
  top_rated: { labelKey: 'erranderList.badges.topRated', bg: '#FFEDD5', color: '#EA580C' },
  new: { labelKey: 'erranderList.badges.new', bg: '#D1FAE5', color: '#059669' },
  native_en: { labelKey: 'erranderList.badges.nativeEn', bg: '#E0F2FE', color: '#0284C7' },
};

export function ErranderCard({ errander }: { errander: Errander }) {
  const { t } = useTranslation();
  const badge = errander.badge ? BADGE_CONFIG[errander.badge] : null;

  return (
    <Link
      to={`/users/${errander.id}`}
      state={{
        profileSeed: {
          id: errander.id,
          name: errander.name,
          initial: errander.initial,
          role: 'errander',
          areas: errander.areas,
          completedCount: errander.completedJobs,
          averageRating: errander.rating,
          reviewCount: errander.completedJobs,
          recentReviews: [],
        },
      }}
      className="mb-3 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
    >
      <div
        className="grid size-14 shrink-0 place-items-center rounded-full text-xl font-bold text-white"
        style={{ backgroundColor: errander.avatarColor }}
      >
        {errander.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <h2 className="truncate text-base font-bold text-[#111827]">{errander.name}</h2>
          {badge ? (
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {t(badge.labelKey)}
            </span>
          ) : null}
        </div>
        <p className="mb-1 truncate text-sm text-[#6B7280]">{errander.specialty}</p>
        <p className="flex items-center gap-1 text-xs text-[#9CA3AF]">
          <Star size={12} fill="#F59E0B" className="text-[#F59E0B]" />
          <span className="font-medium text-[#374151]">{errander.rating}</span>
          <span>· {t('erranderList.completedJobs', { count: errander.completedJobs })} · {errander.languages.join('·')}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-base font-bold text-[#F97316]">₩{(errander.pricePerHour / 1000).toFixed(0)}k</p>
        <p className="text-xs text-[#9CA3AF]">{t('erranderList.perHour')}</p>
      </div>
    </Link>
  );
}
