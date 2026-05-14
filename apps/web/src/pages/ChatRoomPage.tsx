import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronLeft, ChevronRight, CircleDollarSign, ImageIcon, MapPin, Navigation, Plus, X, type LucideIcon } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import { apiClient } from '../api/client';
import { useErrand } from '../api/errands';
import { useMyProfile } from '../api/profile';
import { useCreateConfirmationCard, useRespondCompletionRequest, useRespondConfirmationCard } from '../api/transactions';
import { StateBlock } from '../components/StateBlock';
import { ChatRoom, ErrandCompletionRequest, ErrandConfirmationCard } from '../types/domain';

interface Message {
  messageId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType?: 'TEXT' | 'ERRAND_CONFIRMATION' | 'COMPLETION_REQUEST';
  actionCard?: ErrandConfirmationCard;
  completionRequest?: ErrandCompletionRequest;
  createdAt: string;
}

interface AttachmentAction {
  key: string;
  labelKey: string;
  Icon: LucideIcon;
  iconClassName: string;
  disabled?: boolean;
}

const DATE_PART_PAD_LENGTH = 2;
const FIRST_DAY_OF_MONTH = 1;
const MONTH_STEP = 1;
const CALENDAR_COLUMNS = 7;
const DEFAULT_SCHEDULE_HOUR = 9;
const HOURS_IN_DAY = 24;
const MINUTE_OPTIONS = [0, 15, 30, 45];

interface CalendarCell {
  key: string;
  label: string;
  value: string;
  isEmpty: boolean;
  isDisabled: boolean;
}

function getTodayDateValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + MONTH_STEP).padStart(DATE_PART_PAD_LENGTH, '0');
  const day = String(today.getDate()).padStart(DATE_PART_PAD_LENGTH, '0');
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
    cells.push({ key: `empty-${index}`, label: '', value: '', isEmpty: true, isDisabled: true });
  }
  for (let day = FIRST_DAY_OF_MONTH; day <= lastDate.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const year2 = date.getFullYear();
    const m = String(date.getMonth() + MONTH_STEP).padStart(DATE_PART_PAD_LENGTH, '0');
    const d = String(date.getDate()).padStart(DATE_PART_PAD_LENGTH, '0');
    const value = `${year2}-${m}-${d}`;
    cells.push({ key: value, label: String(day), value, isEmpty: false, isDisabled: value < todayValue });
  }
  const trailingEmptyCount = (CALENDAR_COLUMNS - (cells.length % CALENDAR_COLUMNS)) % CALENDAR_COLUMNS;
  for (let index = 0; index < trailingEmptyCount; index += 1) {
    cells.push({ key: `trailing-empty-${index}`, label: '', value: '', isEmpty: true, isDisabled: true });
  }
  return cells;
}

const ATTACHMENT_ACTIONS: AttachmentAction[] = [
  { key: 'photo', labelKey: 'chat.attachPhoto', Icon: ImageIcon, iconClassName: 'text-[#F97316]' },
  { key: 'camera', labelKey: 'chat.attachCamera', Icon: Camera, iconClassName: 'text-[#F97316]' },
  { key: 'transfer', labelKey: 'chat.attachTransfer', Icon: CircleDollarSign, iconClassName: 'text-[#F97316]' },
  { key: 'map', labelKey: 'chat.attachMap', Icon: MapPin, iconClassName: 'text-[#F97316]' },
];

const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/';

function useMessages(roomId: string | undefined) {
  return useQuery({
    queryKey: ['chat', roomId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ messages?: Message[] }>(`/chat/rooms/${roomId}/messages`);
      return data.messages ?? [];
    },
    enabled: !!roomId,
    refetchInterval: 3_000,
    staleTime: 0,
  });
}

function useSendMessage(roomId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => apiClient.post(`/chat/rooms/${roomId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
}

export function ChatRoomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);
  const [isConfirmationFormOpen, setIsConfirmationFormOpen] = useState(false);
  const [isPaymentQrOpen, setIsPaymentQrOpen] = useState(false);
  const [priceAmount, setPriceAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledHour, setScheduledHour] = useState(DEFAULT_SCHEDULE_HOUR);
  const [scheduledMinute, setScheduledMinute] = useState(0);
  const [scheduleVisibleMonth, setScheduleVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), FIRST_DAY_OF_MONTH);
  });
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [errandTitle, setErrandTitle] = useState('');
  const { data: profile } = useMyProfile();
  const { data: messages = [], isLoading, isError } = useMessages(roomId);
  const sendMessage = useSendMessage(roomId);
  const canSend = input.trim().length > 0 && !sendMessage.isPending;
  const routeState = location.state as { participantName?: string; errandId?: string; receiverId?: string } | null;
  const { data: errandForReceiver } = useErrand(routeState?.errandId);
  const receiverId = routeState?.receiverId ?? errandForReceiver?.travelerId ?? errandForReceiver?.userId;
  const cachedRooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
  const participantName = routeState?.participantName ?? cachedRooms?.find((room) => room.id === roomId)?.erranderName;
  const roomTitle = participantName ? t('chat.roomTitleWithName', { name: participantName }) : t('chat.roomTitleFallback');
  useEffect(() => {
    if (errandForReceiver?.title && !errandTitle) {
      setErrandTitle(errandForReceiver.title);
    }
  }, [errandForReceiver?.title]);

  const createConfirmationCard = useCreateConfirmationCard(routeState?.errandId);
  const todayValue = getTodayDateValue();
  const scheduleCalendarCells = useMemo(() => getCalendarCells(scheduleVisibleMonth, todayValue), [scheduleVisibleMonth, todayValue]);
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), FIRST_DAY_OF_MONTH);
  const isSchedulePreviousMonthDisabled = scheduleVisibleMonth <= currentMonthStart;
  const scheduledTime = `${String(scheduledHour).padStart(DATE_PART_PAD_LENGTH, '0')}:${String(scheduledMinute).padStart(DATE_PART_PAD_LENGTH, '0')}`;
  const scheduledAt = scheduledDate ? `${scheduledDate} ${scheduledTime}` : '';
  const canCreateConfirmation = !!routeState?.errandId && !!receiverId && Number(priceAmount) > 0 && scheduledAt.length > 0 && place.trim().length > 0 && errandTitle.trim().length > 0 && !createConfirmationCard.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    const content = input.trim();
    setInput('');
    setIsAttachmentPanelOpen(false);
    await sendMessage.mutateAsync(content);
  }

  function openGoogleMapsWithCurrentLocation() {
    if (!navigator.geolocation) {
      window.alert(t('chat.locationUnsupported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `${GOOGLE_MAPS_SEARCH_URL}?api=1&query=${latitude},${longitude}`;
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      },
      () => {
        window.alert(t('chat.locationPermissionFailed'));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function handleAttachmentClick(actionKey: string) {
    if (actionKey === 'map') {
      openGoogleMapsWithCurrentLocation();
    }
    if (actionKey === 'transfer') {
      setIsAttachmentPanelOpen(false);
      setIsPaymentQrOpen(true);
    }
  }

  function handleScheduleHourChange(direction: 1 | -1) {
    setScheduledHour((h) => (h + direction + HOURS_IN_DAY) % HOURS_IN_DAY);
  }

  function handleScheduleMinuteChange(direction: 1 | -1) {
    const currentIndex = MINUTE_OPTIONS.indexOf(scheduledMinute);
    const nextIndex = (currentIndex + direction + MINUTE_OPTIONS.length) % MINUTE_OPTIONS.length;
    setScheduledMinute(MINUTE_OPTIONS[nextIndex]!);
  }

  async function handleCreateConfirmationCard() {
    if (!receiverId || !canCreateConfirmation) return;
    await createConfirmationCard.mutateAsync({
      receiverId,
      priceAmount: Number(priceAmount),
      currency: 'KRW',
      scheduledAt,
      place: place.trim(),
      note: note.trim() || undefined,
      errandTitle: errandTitle.trim() || undefined,
    });
    setPriceAmount('');
    setScheduledDate('');
    setScheduledHour(DEFAULT_SCHEDULE_HOUR);
    setScheduledMinute(0);
    setPlace('');
    setNote('');
    setErrandTitle('');
    setIsConfirmationFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['chat', roomId] });
  }

  return (
    <main className="flex min-h-dvh flex-col pb-0">
      {isPaymentQrOpen ? (
        <PaymentQrModal profile={profile} onClose={() => setIsPaymentQrOpen(false)} />
      ) : null}
      <header className="border-b border-[#F3F4F6] px-4 py-3">
        <div className="flex min-h-10 items-center gap-1">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
            className="grid size-10 shrink-0 place-items-center bg-transparent pb-0.5 text-2xl font-normal leading-none text-[#111827]"
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-10 tracking-normal text-[#111827]">{roomTitle}</h1>
        </div>
      </header>
      <section className="flex-1 px-4 py-4">
        {routeState?.errandId ? (
          <div className="mb-4 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-3">
            <button
              type="button"
              onClick={() => setIsConfirmationFormOpen((current) => !current)}
              className="w-full text-left text-sm font-bold text-[#F97316]"
            >
              {isConfirmationFormOpen ? t('transaction.closeConfirmationForm') : t('transaction.createConfirmationCard')}
            </button>
            {isConfirmationFormOpen ? (
              <div className="mt-3 grid gap-2">
                <input
                  value={errandTitle}
                  onChange={(event) => setErrandTitle(event.target.value)}
                  className="rounded-xl border border-[#FED7AA] bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316]"
                  placeholder={t('transaction.errandTitlePlaceholder')}
                />
                <input
                  value={priceAmount}
                  onChange={(event) => setPriceAmount(event.target.value)}
                  inputMode="numeric"
                  className="rounded-xl border border-[#FED7AA] bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316]"
                  placeholder={t('transaction.pricePlaceholder')}
                />
                <div className="rounded-xl border border-[#FED7AA] bg-white p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={isSchedulePreviousMonthDisabled}
                      onClick={() => setScheduleVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - MONTH_STEP, FIRST_DAY_OF_MONTH))}
                      className="grid size-8 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316] disabled:bg-[#F9FAFB] disabled:text-[#D1D5DB]"
                      aria-label={t('errand.previousMonth')}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <strong className="text-sm font-bold text-[#111827]">{getMonthTitle(scheduleVisibleMonth)}</strong>
                    <button
                      type="button"
                      onClick={() => setScheduleVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + MONTH_STEP, FIRST_DAY_OF_MONTH))}
                      className="grid size-8 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                      aria-label={t('errand.nextMonth')}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="mb-1.5 grid grid-cols-7 text-center text-[10px] font-bold text-[#9CA3AF]">
                    <span>{t('errand.weekdaySun')}</span>
                    <span>{t('errand.weekdayMon')}</span>
                    <span>{t('errand.weekdayTue')}</span>
                    <span>{t('errand.weekdayWed')}</span>
                    <span>{t('errand.weekdayThu')}</span>
                    <span>{t('errand.weekdayFri')}</span>
                    <span>{t('errand.weekdaySat')}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {scheduleCalendarCells.map((cell) => {
                      const selected = cell.value === scheduledDate;
                      return (
                        <button
                          key={cell.key}
                          type="button"
                          disabled={cell.isDisabled}
                          onClick={() => setScheduledDate(cell.value)}
                          className={`grid aspect-square place-items-center rounded-full text-xs font-semibold ${
                            selected
                              ? 'bg-[#F97316] text-white shadow-[0_4px_10px_rgba(249,115,22,0.25)]'
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
                  {scheduledDate ? (
                    <div className="mt-3 border-t border-[#FFE4CC] pt-3">
                      <p className="mb-2 text-center text-[10px] font-bold text-[#9CA3AF]">{t('errand.timePicker')}</p>
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleScheduleHourChange(-1)}
                            className="grid size-8 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.previousHour')}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="w-8 text-center text-base font-bold text-[#111827]">
                            {String(scheduledHour).padStart(DATE_PART_PAD_LENGTH, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleScheduleHourChange(1)}
                            className="grid size-8 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.nextHour')}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <span className="text-base font-bold text-[#111827]">:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleScheduleMinuteChange(-1)}
                            className="grid size-8 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.previousMinute')}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="w-8 text-center text-base font-bold text-[#111827]">
                            {String(scheduledMinute).padStart(DATE_PART_PAD_LENGTH, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleScheduleMinuteChange(1)}
                            className="grid size-8 place-items-center rounded-full bg-[#FFF7ED] text-[#F97316]"
                            aria-label={t('errand.nextMinute')}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-xs font-semibold text-[#F97316]">
                        {scheduledDate} {scheduledTime}
                      </p>
                    </div>
                  ) : null}
                </div>
                <input
                  value={place}
                  onChange={(event) => setPlace(event.target.value)}
                  className="rounded-xl border border-[#FED7AA] bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316]"
                  placeholder={t('transaction.placePlaceholder')}
                />
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-20 resize-none rounded-xl border border-[#FED7AA] bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316]"
                  placeholder={t('transaction.notePlaceholder')}
                />
                <button
                  type="button"
                  onClick={handleCreateConfirmationCard}
                  disabled={!canCreateConfirmation}
                  className="rounded-xl bg-[#F97316] py-2.5 text-sm font-bold text-white disabled:bg-[#E5E7EB]"
                >
                  {createConfirmationCard.isPending ? t('transaction.sendingConfirmationCard') : t('transaction.sendConfirmationCard')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        {isLoading ? <StateBlock title={t('chat.messagesLoading')} /> : null}
        {isError ? <StateBlock title={t('chat.messagesLoadError')} description={t('my.authNetworkHelp')} /> : null}
        {!isLoading && !isError && messages.length === 0 ? <StateBlock title={t('chat.messagesEmpty')} /> : null}
        <div className="grid gap-3">
          {messages.map((message) => {
            const isMine = message.senderId === profile?.id;
            if (message.messageType === 'ERRAND_CONFIRMATION' && message.actionCard) {
              return <ConfirmationMessageCard key={message.messageId} card={message.actionCard} currentUserId={profile?.id} />;
            }
            if (message.messageType === 'COMPLETION_REQUEST' && message.completionRequest) {
              return <CompletionRequestCard key={message.messageId} request={message.completionRequest} currentUserId={profile?.id} />;
            }
            return (
              <div key={message.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'text-right' : 'text-left'}`}>
                  {!isMine ? <p className="mb-1 px-1 text-xs text-[#9CA3AF]">{message.senderName}</p> : null}
                  <p className={`rounded-[18px] px-3.5 py-2.5 text-sm leading-5 ${isMine ? 'bg-[#F97316] text-white' : 'bg-white text-[#111827]'}`}>
                    {message.content}
                  </p>
                  <p className="mt-1 px-1 text-[10px] text-[#9CA3AF]">
                    {new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="sticky bottom-[76px] border-t border-[#F3F4F6] bg-white">
        {isAttachmentPanelOpen ? (
          <div className="grid grid-cols-4 gap-3 px-4 pb-4 pt-3">
            {ATTACHMENT_ACTIONS.map(({ key, labelKey, Icon, iconClassName, disabled }) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => handleAttachmentClick(key)}
                className="grid min-w-0 justify-items-center gap-2 rounded-2xl border border-[#F3F4F6] bg-[#FFFDFB] px-2 py-3 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)] disabled:opacity-45"
              >
                <span className="grid size-12 place-items-center rounded-full bg-[#FFF7ED]">
                  <Icon size={32} strokeWidth={2.4} className={iconClassName} />
                </span>
                <span className="w-full truncate text-xs font-semibold leading-none text-[#374151]">{t(labelKey)}</span>
              </button>
            ))}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
          <button
            type="button"
            aria-label={isAttachmentPanelOpen ? t('common.close') : t('chat.attachments')}
            onClick={() => setIsAttachmentPanelOpen((current) => !current)}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#F97316] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          >
            {isAttachmentPanelOpen ? <X size={24} /> : <Plus size={24} />}
          </button>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={1}
            className="max-h-24 flex-1 resize-none rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#F97316]"
            placeholder={t('chat.inputPlaceholder')}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t('chat.send')}
            className="grid size-11 place-items-center rounded-full bg-[#F97316] text-white disabled:bg-[#E5E7EB]"
          >
            <Navigation size={20} fill="currentColor" strokeWidth={2.2} />
          </button>
        </form>
      </div>
    </main>
  );
}

function CompletionRequestCard({ request, currentUserId }: { request: ErrandCompletionRequest; currentUserId: string | undefined }) {
  const { t } = useTranslation();
  const respondCompletionRequest = useRespondCompletionRequest(request.errandId, request.requestId);
  const canRespond = request.receiverId === currentUserId && request.status === 'PENDING' && !respondCompletionRequest.isPending;

  return (
    <article className="rounded-2xl border border-[#BBF7D0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <p className="mb-2 text-sm font-bold text-[#059669]">{t('transaction.completionRequest')}</p>
      <SummaryRow label={t('transaction.status')} value={t(`transaction.cardStatus.${request.status.toLowerCase()}`)} />
      {canRespond ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => respondCompletionRequest.mutate({ action: 'REJECT' })}
            className="rounded-xl border border-[#E5E7EB] bg-white py-2 text-sm font-bold text-[#6B7280]"
          >
            {t('transaction.reject')}
          </button>
          <button
            type="button"
            onClick={() => respondCompletionRequest.mutate({ action: 'ACCEPT' })}
            className="rounded-xl bg-[#059669] py-2 text-sm font-bold text-white"
          >
            {t('transaction.accept')}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ConfirmationMessageCard({ card, currentUserId }: { card: ErrandConfirmationCard; currentUserId: string | undefined }) {
  const { t } = useTranslation();
  const respondConfirmationCard = useRespondConfirmationCard(card.errandId, card.cardId);
  const canRespond = card.receiverId === currentUserId && card.status === 'PENDING' && !respondConfirmationCard.isPending;

  return (
    <article className="rounded-2xl border border-[#FED7AA] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <p className="mb-3 text-sm font-bold text-[#F97316]">{t('transaction.confirmationCard')}</p>
      <div className="grid gap-2 text-sm">
        {card.errandTitle ? <SummaryRow label={t('transaction.errandTitle')} value={card.errandTitle} /> : null}
        <SummaryRow label={t('transaction.price')} value={`₩${card.priceAmount.toLocaleString()}`} />
        <SummaryRow label={t('transaction.schedule')} value={card.scheduledAt} />
        <SummaryRow label={t('transaction.place')} value={card.place} />
        {card.note ? <SummaryRow label={t('transaction.note')} value={card.note} /> : null}
        <SummaryRow label={t('transaction.status')} value={t(`transaction.cardStatus.${card.status.toLowerCase()}`)} />
      </div>
      {canRespond ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => respondConfirmationCard.mutate({ action: 'REJECT' })}
            className="rounded-xl border border-[#E5E7EB] bg-white py-2 text-sm font-bold text-[#6B7280]"
          >
            {t('transaction.reject')}
          </button>
          <button
            type="button"
            onClick={() => respondConfirmationCard.mutate({ action: 'ACCEPT' })}
            className="rounded-xl bg-[#F97316] py-2 text-sm font-bold text-white"
          >
            {t('transaction.accept')}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-[#9CA3AF]">{label}</span>
      <span className="min-w-0 flex-1 text-right text-xs font-semibold text-[#374151]">{value}</span>
    </div>
  );
}

interface PaymentMethod {
  key: string;
  label: string;
  color: string;
  qrValue?: string;
  imageUrl?: string;
}

function PaymentQrModal({ profile, onClose }: { profile: ReturnType<typeof useMyProfile>['data']; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const methods = useMemo<PaymentMethod[]>(() => {
    const result: PaymentMethod[] = [];
    if (profile?.lineId) {
      result.push({ key: 'line', label: 'LINE', color: '#00B900', qrValue: `https://line.me/ti/p/~${profile.lineId}` });
    }
    if (profile?.whatsappPhone) {
      const digits = profile.whatsappPhone.replace(/[^0-9]/g, '');
      result.push({ key: 'whatsapp', label: 'WhatsApp', color: '#25D366', qrValue: `https://wa.me/${digits}` });
    }
    if (profile?.kakaopayQrUrl) {
      result.push({ key: 'kakaopay', label: 'KakaoPay', color: '#FAE100', imageUrl: profile.kakaopayQrUrl });
    }
    return result;
  }, [profile]);

  const selected = methods[selectedIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-[28px] bg-white px-5 pb-10 pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111827]">{t('my.myPaymentQr')}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full bg-[#F3F4F6] text-[#6B7280]">
            <X size={16} />
          </button>
        </div>

        {methods.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-sm text-[#6B7280]">{t('my.noPaymentMethods')}</p>
            <button
              type="button"
              onClick={() => { onClose(); navigate('/my/profile/edit'); }}
              className="rounded-2xl bg-[#F97316] px-6 py-3 text-sm font-bold text-white"
            >
              {t('my.goToProfileEdit')}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex gap-2">
              {methods.map((method, index) => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                    selectedIndex === index ? 'text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                  style={selectedIndex === index ? { backgroundColor: method.color } : undefined}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {selected ? (
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-3xl border-4 p-4" style={{ borderColor: selected.color }}>
                  {selected.imageUrl ? (
                    <img src={selected.imageUrl} alt={`${selected.label} QR`} className="size-52 object-contain" />
                  ) : selected.qrValue ? (
                    <QRCodeCanvas
                      value={selected.qrValue}
                      size={208}
                      fgColor="#111827"
                      bgColor="#FFFFFF"
                      level="M"
                    />
                  ) : null}
                </div>
                <p className="text-sm font-semibold" style={{ color: selected.color }}>{selected.label}</p>
                {selected.qrValue ? (
                  <p className="mt-1 max-w-[240px] truncate text-xs text-[#9CA3AF]">{selected.qrValue}</p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
