import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
  centered?: boolean;
  border?: boolean;
}

export function ScreenHeader({ title, subtitle, back = false, action, centered = false, border = false }: ScreenHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header className={`${border ? 'border-b border-[#F3F4F6]' : ''} px-6 pb-4 pt-4`}>
      <div className="flex min-h-10 items-center gap-3">
        {back ? (
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
            className="grid size-10 place-items-center bg-transparent text-2xl font-normal leading-none text-[#111827]"
          >
            ‹
          </button>
        ) : null}
        <div className={`min-w-0 flex-1 ${centered ? 'text-center' : ''}`}>
          <h1 className={`${centered ? 'text-[17px]' : 'text-2xl'} font-bold tracking-normal text-[#111827]`}>{title}</h1>
          {subtitle ? <p className="mt-1 text-[13px] text-[#9CA3AF]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </header>
  );
}
