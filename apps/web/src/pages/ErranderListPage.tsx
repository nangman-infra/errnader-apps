import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useErranders, useErrandersByAreas } from '../api/erranders';
import { useMyProfile } from '../api/profile';
import { ErranderCard } from '../components/ErranderCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';
import { ALL_AREAS } from '../constants/app';
import { Errander } from '../types/domain';

const ALL_AREA_LABEL = '전체';
const NEARBY_AREA_LABEL = 'nearby';

function areaMatchesErrander(errander: Errander, areaId: string, t: (key: string) => string): boolean {
  const area = ALL_AREAS.find((item) => item.id === areaId);
  if (!area) return false;
  if (errander.areas.includes(area.id)) return true;
  const region = errander.city.toLowerCase();
  return [area.id, area.name, t(area.nameKey)].some((value) => region.includes(value.toLowerCase()));
}

export function ErranderListPage() {
  const { t } = useTranslation();
  const { data: profile } = useMyProfile();
  const [selectedArea, setSelectedArea] = useState(NEARBY_AREA_LABEL);
  const [searchKeyword, setSearchKeyword] = useState('');
  const profileAreaIds = useMemo(() => profile?.areas ?? [], [profile?.areas]);
  const allErrandersQuery = useErranders(ALL_AREA_LABEL);
  const nearbyErrandersQuery = useErrandersByAreas(profileAreaIds);
  const isNearbySelected = selectedArea === NEARBY_AREA_LABEL && profileAreaIds.length > 0;
  const isLoading = isNearbySelected ? nearbyErrandersQuery.isLoading : allErrandersQuery.isLoading;
  const isError = isNearbySelected ? nearbyErrandersQuery.isError : allErrandersQuery.isError;
  const areaOptions = profileAreaIds.length > 0
    ? [
        { id: NEARBY_AREA_LABEL, label: t('erranderList.nearMyAreas') },
        { id: ALL_AREA_LABEL, label: t('category.all') },
      ]
    : [{ id: ALL_AREA_LABEL, label: t('category.all') }];

  const filteredErranders = useMemo(() => {
    const queriedErranders = isNearbySelected ? nearbyErrandersQuery.data : (allErrandersQuery.data ?? []);
    const availableErranders = queriedErranders.filter((errander) => errander.isAvailable);
    const areaFilteredErranders = isNearbySelected && availableErranders.length === 0
      ? (allErrandersQuery.data ?? [])
          .filter((errander) => errander.isAvailable)
          .filter((errander) => profileAreaIds.some((areaId) => areaMatchesErrander(errander, areaId, t)))
      : availableErranders;
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return areaFilteredErranders;
    return areaFilteredErranders.filter((errander) =>
      [errander.name, errander.specialty, errander.city].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [allErrandersQuery.data, isNearbySelected, nearbyErrandersQuery.data, profileAreaIds, searchKeyword, t]);

  return (
    <main>
      <ScreenHeader title={t('erranderList.title')} />
      <div className="px-6 pb-4">
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <Search size={18} className="text-[#9CA3AF]" />
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder={t('erranderList.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#374151] outline-none placeholder:text-[#9CA3AF]"
          />
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {areaOptions.map((area) => {
            const isActive = selectedArea === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedArea(area.id)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold ${
                  isActive ? 'border-[#F97316] bg-[#F97316] text-white' : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                }`}
              >
                {area.label}
              </button>
            );
          })}
        </div>
        {isLoading ? <StateBlock title={t('erranderList.loading')} /> : null}
        {isError ? <StateBlock title={t('erranderList.loadError')} description={t('my.authNetworkHelp')} /> : null}
        {!isLoading && !isError && filteredErranders.length === 0 ? <StateBlock title={t('erranderList.empty')} /> : null}
        {filteredErranders.map((errander) => (
          <ErranderCard key={errander.id} errander={errander} />
        ))}
      </div>
    </main>
  );
}
