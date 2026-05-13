import { Link } from 'react-router-dom';
import { AppWindow, Calendar, ChevronRight, Navigation, Plane, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useErranders } from '../api/erranders';
import { useErrands } from '../api/errands';
import { useMyProfile } from '../api/profile';
import { ErrandCard } from '../components/ErrandCard';
import { StateBlock } from '../components/StateBlock';
import { ALL_AREAS, MAX_HOME_CARDS, SERVICE_ITEMS } from '../constants/app';
import { Errand, Errander } from '../types/domain';

const SERVICE_ICON_CONFIG = {
  Calendar: { Icon: Calendar, bg: '#FEE2E2', color: '#EF4444' },
  Plane: { Icon: Plane, bg: '#FFEDD5', color: '#F97316' },
  Navigation: { Icon: Navigation, bg: '#FEF3C7', color: '#F59E0B' },
  Grid: { Icon: AppWindow, bg: '#FEF3C7', color: '#F59E0B' },
};

function getAreaNames(areaIds: string[], t: (key: string) => string): string[] {
  return areaIds
    .map((id) => {
      const area = ALL_AREAS.find((item) => item.id === id);
      return area ? t(area.nameKey) : undefined;
    })
    .filter(Boolean)
    .map(String);
}

function filterByAreas(errands: Errand[], profileAreaIds: string[]): Errand[] {
  if (profileAreaIds.length === 0) return errands;
  const areaNames = profileAreaIds
    .map((id) => ALL_AREAS.find((area) => area.id === id)?.name)
    .filter(Boolean)
    .map(String);
  const matched = errands.filter((errand) =>
    errand.areaId ? profileAreaIds.includes(errand.areaId) : areaNames.some((name) => errand.where.includes(name)),
  );
  return matched.length > 0 ? matched : errands;
}

function HomeErranderCard({ errander }: { errander: Errander }) {
  const { t } = useTranslation();
  return (
    <article className="mr-3 w-44 shrink-0 rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-2 grid size-10 place-items-center rounded-full text-base font-bold text-white" style={{ backgroundColor: errander.avatarColor }}>
        {errander.initial}
      </div>
      <h3 className="mb-0.5 truncate text-sm font-semibold text-[#111827]">{errander.name}</h3>
      <p className="mb-2 flex items-center gap-1 text-xs">
        <Star size={12} fill="#F59E0B" className="text-[#F59E0B]" />
        <span className="font-medium text-[#374151]">{errander.rating}</span>
        <span className="text-[#9CA3AF]">· {errander.completedJobs}</span>
      </p>
      <p className="mb-2 truncate text-xs text-[#6B7280]">{errander.specialty}</p>
      <p className="text-xs text-[#9CA3AF]">{errander.languages.join(' · ')}</p>
      <p className="mt-1 text-xs font-semibold text-[#F97316]">₩{(errander.pricePerHour / 1000).toFixed(0)}k{t('home.perHour')}</p>
    </article>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const isErrander = profile?.role === 'errander';
  const { data: errands = [], isLoading: isErrandsLoading } = useErrands({ status: 'PENDING' });
  const { data: erranders = [], isLoading: isErrandersLoading } = useErranders('전체');

  const profileAreaIds = profile?.areas ?? [];
  const areaNames = getAreaNames(profileAreaIds, t);
  const nearbyErrands = filterByAreas(errands, profileAreaIds).slice(0, MAX_HOME_CARDS);
  const sectionTitle = areaNames.length > 0
    ? t('home.nearbyErrands', { areas: areaNames.slice(0, 2).join(' · ') })
    : t('home.registeredErrands');

  return (
    <main>
      <header className="px-6 pb-5 pt-4">
        <p className="mb-1 text-sm text-[#6B7280]">{isErrander ? t('home.erranderGreeting') : t('home.travelerGreeting')}</p>
        <div className="flex items-center gap-3">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F97316] text-sm font-bold text-white">
              {profile?.initial ?? '?'}
            </div>
          )}
          <h1 className="min-w-0 truncate text-2xl font-bold text-[#111827]">
            {profile?.name ?? t('common.loading')} {t('home.nameSuffix')}
          </h1>
        </div>
      </header>

      {isProfileLoading ? <StateBlock title={t('home.profileLoading')} /> : null}

      {isErrander ? (
        <section className="px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{sectionTitle}</h2>
            <Link to="/errands" className="text-sm font-semibold text-[#F97316]">
              {t('home.viewAll')}
            </Link>
          </div>
          {isErrandsLoading ? <StateBlock title={t('home.errandsLoading')} /> : null}
          {!isErrandsLoading && nearbyErrands.length === 0 ? <StateBlock title={t('home.noNearbyErrands')} /> : null}
          {nearbyErrands.map((errand) => (
            <ErrandCard key={errand.errandId} errand={errand} />
          ))}
        </section>
      ) : (
        <>
          <section className="mb-6 px-6">
            <h2 className="mb-4 text-lg font-bold">{t('home.servicesTitle')}</h2>
            <div className="grid gap-2.5">
              {SERVICE_ITEMS.map((service) => {
                const icon = SERVICE_ICON_CONFIG[service.icon as keyof typeof SERVICE_ICON_CONFIG];
                const Icon = icon.Icon;
                return (
                  <Link
                    key={service.id}
                    to={service.href}
                    className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                  >
                    <span className="grid size-12 place-items-center rounded-xl" style={{ backgroundColor: icon.bg, color: icon.color }}>
                      <Icon size={24} />
                    </span>
                    <span className="flex-1 text-base font-medium text-[#111827]">{t(service.labelKey)}</span>
                    <ChevronRight size={18} className="text-[#D1D5DB]" />
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="pb-6">
            <div className="mb-3 flex items-center justify-between px-6">
              <h2 className="text-lg font-bold">{t('home.recommendedErranders')}</h2>
              <Link to="/erranders" className="text-sm font-semibold text-[#F97316]">
                {t('home.viewAll')}
              </Link>
            </div>
            {isErrandersLoading ? <StateBlock title={t('home.errandersLoading')} /> : null}
            {!isErrandersLoading && erranders.length === 0 ? <StateBlock title={t('home.noErranders')} /> : null}
            <div className="flex overflow-x-auto px-6 pb-1">
              {erranders.slice(0, 5).map((errander) => (
                <HomeErranderCard key={errander.id} errander={errander} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
