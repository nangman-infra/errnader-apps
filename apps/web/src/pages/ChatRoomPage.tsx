import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CircleDollarSign, ImageIcon, MapPin, Navigation, Plus, X, type LucideIcon } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
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

const ATTACHMENT_ACTIONS: AttachmentAction[] = [
  { key: 'photo', labelKey: 'chat.attachPhoto', Icon: ImageIcon, iconClassName: 'text-[#F97316]' },
  { key: 'camera', labelKey: 'chat.attachCamera', Icon: Camera, iconClassName: 'text-[#F97316]' },
  { key: 'transfer', labelKey: 'chat.attachTransfer', Icon: CircleDollarSign, iconClassName: 'text-[#F97316]', disabled: true },
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
  const [priceAmount, setPriceAmount] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const { data: profile } = useMyProfile();
  const { data: messages = [], isLoading, isError } = useMessages(roomId);
  const sendMessage = useSendMessage(roomId);
  const canSend = input.trim().length > 0 && !sendMessage.isPending;
  const routeState = location.state as { participantName?: string; errandId?: string; receiverId?: string } | null;
  const cachedRooms = queryClient.getQueryData<ChatRoom[]>(['chatRooms']);
  const participantName = routeState?.participantName ?? cachedRooms?.find((room) => room.id === roomId)?.erranderName;
  const roomTitle = participantName ? t('chat.roomTitleWithName', { name: participantName }) : t('chat.roomTitleFallback');
  const createConfirmationCard = useCreateConfirmationCard(routeState?.errandId);
  const canCreateConfirmation = !!routeState?.errandId && !!routeState.receiverId && Number(priceAmount) > 0 && scheduledAt.length > 0 && place.trim().length > 0 && !createConfirmationCard.isPending;

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
  }

  async function handleCreateConfirmationCard() {
    if (!routeState?.receiverId || !canCreateConfirmation) return;
    await createConfirmationCard.mutateAsync({
      receiverId: routeState.receiverId,
      priceAmount: Number(priceAmount),
      currency: 'KRW',
      scheduledAt,
      place: place.trim(),
      note: note.trim() || undefined,
    });
    setPriceAmount('');
    setScheduledAt('');
    setPlace('');
    setNote('');
    setIsConfirmationFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['chat', roomId] });
  }

  return (
    <main className="flex min-h-dvh flex-col pb-0">
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
                  value={priceAmount}
                  onChange={(event) => setPriceAmount(event.target.value)}
                  inputMode="numeric"
                  className="rounded-xl border border-[#FED7AA] bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316]"
                  placeholder={t('transaction.pricePlaceholder')}
                />
                <input
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  type="datetime-local"
                  className="rounded-xl border border-[#FED7AA] bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316]"
                />
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
