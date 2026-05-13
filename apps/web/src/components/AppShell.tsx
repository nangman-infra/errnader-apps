import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BriefcaseBusiness, House, MessageCircle, Search, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChatRooms } from '../api/chat';
import { useMyProfile } from '../api/profile';
import { changeAppLanguage } from '../i18n';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { useNativeBridge } from '../hooks/useNativeBridge';

export function AppShell() {
  const { t } = useTranslation();
  const { isInWebView, hasAuthToken } = useNativeBridge();
  useChatWebSocket();
  const { data: profile } = useMyProfile();
  const { data: chatRooms = [] } = useChatRooms();
  const isTraveler = profile?.role === 'traveler';
  const totalUnread = chatRooms.reduce((sum, room) => sum + (room.unreadCount ?? 0), 0);
  const navItems = [
    { labelKey: 'tabs.home', to: '/', Icon: House },
    isTraveler
      ? { labelKey: 'tabs.findErranders', to: '/erranders', Icon: Search }
      : { labelKey: 'tabs.errander', to: '/errands', Icon: BriefcaseBusiness },
    { labelKey: 'tabs.chat', to: '/chat', Icon: MessageCircle },
    { labelKey: 'tabs.my', to: '/my', Icon: User },
  ];

  useEffect(() => {
    if (!profile?.language) return;
    changeAppLanguage(profile.language);
  }, [profile?.language]);

  return (
    <div className="min-h-dvh bg-[#FFF9F4] text-[#111827]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FFF9F4]">
        <div className="flex-1 pb-[85px]">
          <Outlet />
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-20 h-[85px] border-t border-[#F3F4F6] bg-white">
          <div className="mx-auto grid h-full max-w-md grid-cols-4 pb-2 pt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                    isActive ? 'text-[#F97316]' : 'text-[#9CA3AF]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <item.Icon size={22} fill={isActive ? 'currentColor' : 'none'} strokeWidth={2} />
                      {item.to === '/chat' && totalUnread > 0 ? (
                        <span className="absolute -right-2 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#EF4444] px-1 text-[9px] font-bold leading-none text-white">
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                      ) : null}
                    </span>
                    <span>{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
        {!hasAuthToken && isInWebView ? (
          <div className="fixed inset-x-0 top-0 z-30 mx-auto max-w-md bg-[#111827] px-4 py-2 text-center text-xs text-white">
            {t('auth.waitingToken')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
