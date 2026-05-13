import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMyErrands } from '../api/errands';
import { useMyProfile } from '../api/profile';
import { ErrandCard } from '../components/ErrandCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';
import { STATUS_FILTERS } from '../constants/app';
import { ErrandStatus } from '../types/domain';

export function MyErrandsPage() {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<ErrandStatus | undefined>(undefined);
  const { data: profile } = useMyProfile();
  const { data: errands = [], isLoading, isError } = useMyErrands(selectedStatus);
  const subtitle = profile?.role === 'errander' ? t('errand.myErranderSubtitle') : t('errand.myTravelerSubtitle');

  return (
    <main>
      <ScreenHeader title={t('errand.myTitle')} back centered border />
      <div className="px-6 pb-1 pt-5">
        <p className="text-[13px] text-[#9CA3AF]">{subtitle}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto px-6 py-4">
        {STATUS_FILTERS.map((filter) => {
          const isActive = selectedStatus === filter.value;
          return (
            <button
              key={filter.labelKey}
              type="button"
              onClick={() => setSelectedStatus(filter.value)}
              className={`shrink-0 rounded-2xl border px-3.5 py-[7px] text-[13px] font-semibold ${
                isActive ? 'border-[#F97316] bg-[#F97316] text-white' : 'border-[#E5E7EB] bg-white text-[#4B5563]'
              }`}
            >
              {t(filter.labelKey)}
            </button>
          );
        })}
      </div>
      <section className="px-6 pb-6">
        {isLoading ? <StateBlock title={t('errand.myLoading')} /> : null}
        {isError ? <StateBlock title={t('errand.myLoadError')} description={t('my.authNetworkHelp')} /> : null}
        {!isLoading && !isError && errands.length === 0 ? <StateBlock title={t('errand.myEmpty')} /> : null}
        {errands.map((errand) => (
          <ErrandCard key={errand.errandId} errand={errand} showStatus />
        ))}
      </section>
    </main>
  );
}
