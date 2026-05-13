import { Link } from 'react-router-dom';
import { AppWindow, Calendar, Clock3, MapPin, Navigation, Plane, Text } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STATUS_CONFIG } from '../constants/app';
import { Errand } from '../types/domain';
import { getCategoryKey } from '../utils/translation';

const CATEGORY_CONFIG: Record<string, { Icon: typeof Calendar; bg: string; color: string }> = {
  '예약 대행': { Icon: Calendar, bg: '#FEE2E2', color: '#EF4444' },
  '공항 픽업': { Icon: Plane, bg: '#FFEDD5', color: '#F97316' },
  '길찾기': { Icon: Navigation, bg: '#FEF3C7', color: '#F59E0B' },
  Reservation: { Icon: Calendar, bg: '#FEE2E2', color: '#EF4444' },
  'Airport Pickup': { Icon: Plane, bg: '#FFEDD5', color: '#F97316' },
  Navigation: { Icon: Navigation, bg: '#FEF3C7', color: '#F59E0B' },
};

const DEFAULT_CATEGORY = { Icon: AppWindow, bg: '#F3F4F6', color: '#6B7280' };
const DEFAULT_ERRAND_BUDGET_LABEL = '₩18,000 - 25,000';

function timeAgo(isoString: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSeconds < 5) return t('timeAgo.justNow');
  if (diffSeconds < 60) return t('timeAgo.seconds', { count: Math.max(diffSeconds, 0) });
  if (diffSeconds < 3600) return t('timeAgo.minutes', { count: Math.floor(diffSeconds / 60) });
  if (diffSeconds < 86400) return t('timeAgo.hours', { count: Math.floor(diffSeconds / 3600) });
  return t('timeAgo.days', { count: Math.floor(diffSeconds / 86400) });
}

interface ErrandCardProps {
  errand: Errand;
  showStatus?: boolean;
}

export function ErrandCard({ errand, showStatus = false }: ErrandCardProps) {
  const { t } = useTranslation();
  const category = CATEGORY_CONFIG[errand.category] ?? DEFAULT_CATEGORY;
  const status = STATUS_CONFIG[errand.status] ?? STATUS_CONFIG.PENDING;
  const CategoryIcon = category.Icon;
  const categoryKey = getCategoryKey(errand.category);

  return (
    <Link
      to={`/errands/${errand.errandId}`}
      className="mb-3 block rounded-[20px] bg-white p-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="grid size-11 shrink-0 place-items-center rounded-[14px]"
          style={{ backgroundColor: category.bg, color: category.color }}
        >
          <CategoryIcon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#111827]">{errand.title}</p>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">{categoryKey ? t(categoryKey) : errand.category}</p>
        </div>
        {showStatus ? (
          <span
            className="rounded-[10px] px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {t(status.labelKey)}
          </span>
        ) : (
          <span className="text-xs text-[#9CA3AF]">{timeAgo(errand.createdAt, t)}</span>
        )}
      </div>
      <div className="flex gap-4 text-[13px] text-[#6B7280]">
        <span className="flex items-center gap-1"><Clock3 size={13} className="text-[#9CA3AF]" />{errand.when}</span>
        <span className="min-w-0 flex flex-1 items-center gap-1 truncate"><MapPin size={13} className="shrink-0 text-[#9CA3AF]" />{errand.where}</span>
      </div>
      {errand.detail ? <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#6B7280]">{errand.detail}</p> : null}
      <p className="mt-3 text-sm font-bold text-[#F97316]">{DEFAULT_ERRAND_BUDGET_LABEL}</p>
      {!showStatus ? (
        <div className="mt-2 flex justify-end">
          <span className="flex items-center gap-1 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-[18px] py-2 text-[13px] font-bold text-[#F97316]">
            <Text size={13} /> {t('errand.detailButton')}
          </span>
        </div>
      ) : null}
    </Link>
  );
}
