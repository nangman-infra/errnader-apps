import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrands } from '../api/errands';
import { ErrandCard } from '../components/ErrandCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';
import { CATEGORY_FILTERS } from '../constants/app';

export function ErrandBoardPage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data: errands = [], isLoading, isError } = useErrands({ category: selectedCategory });

  return (
    <main>
      <ScreenHeader title={t('errand.boardTitle')} subtitle={t('errand.boardSubtitle')} />
      <div className="flex flex-wrap gap-2 px-6 py-4">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = selectedCategory === filter.value;
          return (
            <button
              key={filter.labelKey}
              type="button"
              onClick={() => setSelectedCategory(filter.value)}
              className={`rounded-[20px] border px-3.5 py-2 text-[13px] font-semibold ${
                isActive ? 'border-[#F97316] bg-[#F97316] text-white' : 'border-[#E5E7EB] bg-white text-[#4B5563]'
              }`}
            >
              {t(filter.labelKey)}
            </button>
          );
        })}
      </div>
      <section className="px-6 pb-6">
        {isLoading ? <StateBlock title={t('errand.loading')} /> : null}
        {isError ? <StateBlock title={t('errand.loadError')} description={t('my.authNetworkHelp')} /> : null}
        {!isLoading && !isError && errands.length === 0 ? <StateBlock title={t('errand.empty')} /> : null}
        {errands.map((errand) => (
          <ErrandCard key={errand.errandId} errand={errand} />
        ))}
      </section>
    </main>
  );
}
