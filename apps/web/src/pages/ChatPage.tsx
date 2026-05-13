import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatRooms } from '../api/chat';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateBlock } from '../components/StateBlock';

export function ChatPage() {
  const { t } = useTranslation();
  const { data: rooms = [], isLoading, isError } = useChatRooms();

  return (
    <main>
      <ScreenHeader title={t('chat.title')} />
      <section className="px-6">
        {isLoading ? <StateBlock title={t('chat.roomsLoading')} /> : null}
        {isError ? <StateBlock title={t('chat.roomsLoadError')} description={t('my.authNetworkHelp')} /> : null}
        {!isLoading && !isError && rooms.length === 0 ? <StateBlock title={t('chat.roomsEmpty')} /> : null}
        {rooms.length > 0 ? (
          <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            {rooms.map((room, index) => (
              <Link key={room.id} to={`/chat/${room.id}`} state={{ participantName: room.erranderName }} className="block">
                <div className="flex items-center gap-[14px] px-5 py-4">
                  <div className="grid size-12 place-items-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: room.avatarColor }}>
                    {room.erranderInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 truncate text-[15px] font-bold">{room.erranderName}</h2>
                    <p className="truncate text-[13px] text-[#6B7280]">{room.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-[#9CA3AF]">{room.time}</span>
                    {room.unreadCount > 0 ? (
                      <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-[#F97316] px-1.5 text-[11px] font-bold text-white">
                        {room.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                {index < rooms.length - 1 ? <div className="mx-5 border-b border-[#F3F4F6]" /> : null}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
