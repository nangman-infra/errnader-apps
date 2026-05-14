import { FormEvent, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { ALL_AREAS } from '../constants/app';

const WHEN_OPTIONS = [
  { id: 'now', labelKey: null, fallback: 'now' },
  { id: 'date', labelKey: 'errand.selectDate', fallback: '' },
] as const;

const DATE_PART_PAD_LENGTH = 2;
const FIRST_DAY_OF_MONTH = 1;
const MONTH_STEP = 1;
const CALENDAR_COLUMNS = 7;
const TOTAL_STEPS = 4;
const DEFAULT_HOUR = 9;
const HOURS_IN_DAY = 24;
const MINUTE_OPTIONS = [0, 15, 30, 45];

type FormStep = 1 | 2 | 3 | 4;

interface CalendarCell {
  key: string;
  label: string;
  value: string;
  isEmpty: boolean;
  isDisabled: boolean;
}

function getTodayDateValue(): string {
  const today = new Date();
  return formatDateValue(today);
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + MONTH_STEP).padStart(DATE_PART_PAD_LENGTH, '0');
  const day = String(date.getDate()).padStart(DATE_PART_PAD_LENGTH, '0');
  return `${year}-${month}-${day}`;
}

function getMonthTitle(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + MONTH_STEP).padStart(DATE_PART_PAD_LENGTH, '0')}`;
}

function getCalendarCells(monthDate: Date, todayValue: string): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDate = new Date(year, month, FIRST_DAY_OF_MONTH);
  const lastDate = new Date(year, month + MONTH_STEP, 0);
  const leadingEmptyCount = firstDate.getDay();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < leadingEmptyCount; index += 1) {
    cells.push({
      key: `empty-${index}`,
      label: '',
      value: '',
      isEmpty: true,
      isDisabled: true,
    });
  }

  for (let day = FIRST_DAY_OF_MONTH; day <= lastDate.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const value = formatDateValue(date);
    cells.push({
      key: value,
      label: String(day),
      value,
      isEmpty: false,
      isDisabled: value < todayValue,
    });
  }

  const trailingEmptyCount = (CALENDAR_COLUMNS - (cells.length % CALENDAR_COLUMNS)) % CALENDAR_COLUMNS;
  for (let index = 0; index < trailingEmptyCount; index += 1) {
    cells.push({
      key: `trailing-empty-${index}`,
      label: '',
      value: '',
      isEmpty: true,
      isDisabled: true,
    });
  }

  return cells;
}

export function ErrandNewPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialWhat = useMemo(() => searchParams.get('what') ?? '', [searchParams]);
  const [step, setStep] = useState<FormStep>(1);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState<(typeof WHEN_OPTIONS)[number]['id']>('now');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState(DEFAULT_HOUR);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), FIRST_DAY_OF_MONTH);
  });
  const [areaId, setAreaId] = useState<string>(ALL_AREAS[0]?.id ?? '');
  const [where, setWhere] = useState('');
  const [detail, setDetail] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isConfirmChecked, setIsConfirmChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = title.trim().length > 0 && (when === 'now' || selectedDate.length > 0) && areaId.length > 0 && !isSubmitting;
  const canConfirmSubmit = canSubmit && isConfirmChecked;
  const todayValue = getTodayDateValue();
  const calendarCells = useMemo(() => getCalendarCells(visibleMonth, todayValue), [todayValue, visibleMonth]);
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), FIRST_DAY_OF_MONTH);
  const isPreviousMonthDisabled = visibleMonth <= currentMonthStart;
  const selectedArea = ALL_AREAS.find((area) => area.id === areaId);
  const selectedAreaName = selectedArea ? t(selectedArea.nameKey) : '';
  const selectedTime = `${String(selectedHour).padStart(DATE_PART_PAD_LENGTH, '0')}:${String(selectedMinute).padStart(DATE_PART_PAD_LENGTH, '0')}`;
  const selectedWhenLabel = when === 'date' && selectedDate ? `${selectedDate} ${selectedTime}` : 'now';
  const canMoveNext = (() => {
    if (step === 1) return title.trim().length > 0;
    if (step === 2) return when === 'now' || selectedDate.length > 0;
    if (step === 3) return areaId.length > 0;
    return canSubmit;
  })();

  function moveVisibleMonth(monthOffset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + monthOffset, FIRST_DAY_OF_MONTH));
  }

  function handleHourChange(direction: 1 | -1) {
    setSelectedHour((h) => (h + direction + HOURS_IN_DAY) % HOURS_IN_DAY);
  }

  function handleMinuteChange(direction: 1 | -1) {
    const currentIndex = MINUTE_OPTIONS.indexOf(selectedMinute);
    const nextIndex = (currentIndex + direction + MINUTE_OPTIONS.length) % MINUTE_OPTIONS.length;
    setSelectedMinute(MINUTE_OPTIONS[nextIndex]!);
  }

  function handleBack() {
    if (step === 1) {
      navigate(-1);
      return;
    }
    setStep((current) => (current - 1) as FormStep);
  }

  function handleNext() {
    if (!canMoveNext || step === TOTAL_STEPS) return;
    if (step === TOTAL_STEPS - 1) {
      setIsConfirmChecked(false);
    }
    setStep((current) => (current + 1) as FormStep);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== TOTAL_STEPS || !canConfirmSubmit) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await apiClient.post('/errands', {
        title: title.trim(),
        category: initialWhat || '기타',
        when: when === 'date' ? `${selectedDate} ${selectedTime}` : 'now',
        areaId,
        where: where.trim(),
        detail: detail.trim() || null,
        photoUrls: [],
        budgetAmount: budgetAmount.trim() ? Number(budgetAmount) : null,
        budgetCurrency: budgetAmount.trim() ? 'KRW' : null,
      });
      void queryClient.invalidateQueries({ queryKey: ['errands'] });
      navigate('/my/errands', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('errand.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#FFF9F4]">
      <header className="flex items-center justify-between px-4 pb-3 pt-2">
        <button type="button" onClick={handleBack} className="grid size-10 place-items-center text-2xl text-[#1C1C1E]" aria-label={t('common.back')}>
          ‹
        </button>
        <p className="text-base font-medium text-[#6B7280]">{step} / {TOTAL_STEPS}</p>
        <button type="button" onClick={() => navigate(-1)} className="grid size-10 place-items-center text-[#1C1C1E]" aria-label={t('common.close')}>
          <X size={24} />
        </button>
      </header>
      <div className="mb-8 grid grid-cols-4 gap-1.5 px-4">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span key={index} className={`h-1 rounded-full ${index < step ? 'bg-[#F97316]' : 'bg-[#E5E7EB]'}`} />
        ))}
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6 px-6 pb-6">
        {step === 1 ? (
          <label className="grid gap-4">
            <span>
              <span className="block text-2xl font-bold text-[#111827]">{t('errand.whatTitle')}</span>
              <span className="mt-1 block text-sm text-[#6B7280]">{t('errand.whatHelp')}</span>
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-base font-normal outline-none focus:border-[#F97316]"
              placeholder={initialWhat || t('errand.whatPlaceholder')}
            />
          </label>
        ) : null}

        {step === 2 ? (
          <fieldset className="grid gap-3">
            <legend className="text-2xl font-bold text-[#111827]">{t('errand.whenTitle')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {WHEN_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setWhen(option.id)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                    when === option.id ? 'border-[#F97316] bg-[#F97316] text-white' : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                  }`}
                >
                  {option.labelKey ? t(option.labelKey) : option.fallback}
                </button>
              ))}
            </div>
            {when === 'date' ? (
              <div className="rounded-[20px] border border-[#FFE4CC] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={isPreviousMonthDisabled}
                    onClick={() => moveVisibleMonth(-MONTH_STEP)}
                    className="grid size-9 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316] disabled:bg-[#F9FAFB] disabled:text-[#D1D5DB]"
                    aria-label={t('errand.previousMonth')}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <strong className="text-base font-bold text-[#111827]">{getMonthTitle(visibleMonth)}</strong>
                  <button
                    type="button"
                    onClick={() => moveVisibleMonth(MONTH_STEP)}
                    className="grid size-9 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                    aria-label={t('errand.nextMonth')}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-bold text-[#9CA3AF]">
                  <span>{t('errand.weekdaySun')}</span>
                  <span>{t('errand.weekdayMon')}</span>
                  <span>{t('errand.weekdayTue')}</span>
                  <span>{t('errand.weekdayWed')}</span>
                  <span>{t('errand.weekdayThu')}</span>
                  <span>{t('errand.weekdayFri')}</span>
                  <span>{t('errand.weekdaySat')}</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarCells.map((cell) => {
                    const selected = cell.value === selectedDate;
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        disabled={cell.isDisabled}
                        onClick={() => setSelectedDate(cell.value)}
                        className={`grid aspect-square place-items-center rounded-full text-sm font-semibold ${
                          selected
                            ? 'bg-[#F97316] text-white shadow-[0_6px_14px_rgba(249,115,22,0.28)]'
                            : cell.isEmpty
                              ? 'text-transparent'
                              : cell.isDisabled
                                ? 'text-[#D1D5DB]'
                                : 'bg-[#FFF9F4] text-[#374151]'
                        }`}
                      >
                        {cell.label}
                      </button>
                    );
                  })}
                </div>
                {selectedDate ? (
                  <>
                    <div className="mt-4 border-t border-[#FFE4CC] pt-4">
                      <p className="mb-3 text-center text-xs font-bold text-[#9CA3AF]">{t('errand.timePicker')}</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleHourChange(-1)}
                            className="grid size-9 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.previousHour')}
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <span className="w-10 text-center text-xl font-bold text-[#111827]">
                            {String(selectedHour).padStart(DATE_PART_PAD_LENGTH, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleHourChange(1)}
                            className="grid size-9 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.nextHour')}
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                        <span className="text-xl font-bold text-[#111827]">:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(-1)}
                            className="grid size-9 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.previousMinute')}
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <span className="w-10 text-center text-xl font-bold text-[#111827]">
                            {String(selectedMinute).padStart(DATE_PART_PAD_LENGTH, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMinuteChange(1)}
                            className="grid size-9 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.nextMinute')}
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-center text-xs font-semibold text-[#F97316]">
                      {t('errand.selectedDate', { date: selectedDate })} {selectedTime}
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}
          </fieldset>
        ) : null}

        {step === 3 ? (
          <>
            <label className="grid gap-2 text-base font-bold text-[#111827]">
              {t('errand.whereTitle')}
              <select
                value={areaId}
                onChange={(event) => setAreaId(event.target.value)}
                className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-normal outline-none focus:border-[#F97316]"
              >
                {ALL_AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {t(area.nameKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#111827]">
              {t('errand.exactPlace')}
              <input
                value={where}
                onChange={(event) => setWhere(event.target.value)}
                className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-normal outline-none focus:border-[#F97316]"
                placeholder={t('errand.exactPlacePlaceholder')}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#111827]">
              {t('errand.detail')}
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                className="min-h-28 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-base font-normal outline-none focus:border-[#F97316]"
                placeholder={t('errand.detailPlaceholder')}
              />
            </label>
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[#111827]">
                {t('errand.budgetTitle')}
                <span className="ml-1 text-xs font-normal text-[#9CA3AF]">{t('common.optional')}</span>
              </span>
              <div className="flex overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white focus-within:border-[#F97316]">
                <span className="flex items-center pl-4 text-base font-bold text-[#111827]">₩</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetAmount}
                  onChange={(event) => setBudgetAmount(event.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 bg-transparent px-3 py-3 text-base font-normal outline-none"
                  placeholder={t('errand.budgetAmountPlaceholder')}
                />
              </div>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <section className="grid gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111827]">{t('errand.confirmTitle')}</h1>
              <p className="mt-1 text-sm text-[#6B7280]">{t('errand.confirmSubtitle')}</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <SummaryRow label={t('errand.whatTitle')} value={title.trim() || '—'} />
              <div className="my-3 h-px bg-[#F3F4F6]" />
              <SummaryRow label={t('errand.whenTitle')} value={selectedWhenLabel} />
              <div className="my-3 h-px bg-[#F3F4F6]" />
              <SummaryRow label={t('errand.whereTitle')} value={[selectedAreaName, where.trim()].filter(Boolean).join(' · ') || '—'} />
              {detail.trim() ? (
                <>
                  <div className="my-3 h-px bg-[#F3F4F6]" />
                  <SummaryRow label={t('errand.detail')} value={detail.trim()} />
                </>
              ) : null}
            </div>
            <div className="rounded-2xl bg-[#FEFCE8] px-5 py-4">
              <p className="mb-1 text-sm font-bold text-[#111827]">{t('errand.budgetTitle')}</p>
              <p className="mb-2 text-xs text-[#6B7280]">{t('errand.budgetHelp')}</p>
              <p className="text-lg font-bold text-[#111827]">
                {budgetAmount.trim() ? `₩${Number(budgetAmount).toLocaleString()}` : t('errand.budgetNotSet')}
              </p>
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-[#FFE4CC] bg-white px-4 py-4">
              <input
                type="checkbox"
                checked={isConfirmChecked}
                onChange={(event) => setIsConfirmChecked(event.target.checked)}
                className="mt-0.5 size-5 accent-[#F97316]"
              />
              <span className="text-sm font-semibold leading-5 text-[#374151]">{t('errand.confirmCheck')}</span>
            </label>
          </section>
        ) : null}

        {errorMessage ? <p className="text-sm font-semibold text-[#EF4444]">{errorMessage}</p> : null}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            disabled={!canMoveNext}
            onClick={handleNext}
            className="rounded-2xl bg-[#F97316] py-4 text-base font-bold text-white disabled:border disabled:border-[#F97316] disabled:bg-white disabled:text-[#F97316]"
          >
            {t('common.next')}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canConfirmSubmit}
            className="rounded-2xl bg-[#F97316] py-4 text-base font-bold text-white disabled:border disabled:border-[#F97316] disabled:bg-white disabled:text-[#F97316]"
          >
            {isSubmitting ? t('errand.submitting') : t('errand.submit')}
          </button>
        )}
      </form>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs text-[#9CA3AF]">{label}</span>
      <span className="min-w-0 flex-1 text-right text-xs leading-5 text-[#374151]">{value}</span>
    </div>
  );
}
