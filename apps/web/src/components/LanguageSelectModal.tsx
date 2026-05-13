import { X, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../constants/languages';

interface LanguageSelectModalProps {
  visible: boolean;
  currentLanguage: string;
  isSaving: boolean;
  onSelect: (languageName: string) => void;
  onClose: () => void;
}

export function LanguageSelectModal({
  visible,
  currentLanguage,
  isSaving,
  onSelect,
  onClose,
}: LanguageSelectModalProps) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40">
      <div className="w-full rounded-t-[28px] bg-white pb-9">
        <div className="flex items-center px-6 pb-4 pt-6">
          <h2 className="flex-1 text-lg font-bold text-[#111827]">{t('language.title')}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center text-[#6B7280]" aria-label={t('common.close')}>
            <X size={22} />
          </button>
        </div>
        <div className="mx-6 mb-2 border-b border-[#F3F4F6]" />
        <div>
          {LANGUAGES.map((language) => {
            const isSelected = currentLanguage === language.name;
            return (
              <button
                key={language.code}
                type="button"
                disabled={isSaving}
                onClick={() => onSelect(language.name)}
                className={`flex w-full items-center gap-3.5 px-6 py-4 text-left ${
                  isSelected ? 'bg-[#FFF7ED]' : 'bg-white'
                }`}
              >
                <span className="text-[26px]">{language.flag}</span>
                <span className={`flex-1 text-base ${isSelected ? 'font-semibold text-[#F97316]' : 'font-normal text-[#111827]'}`}>
                  {language.name}
                </span>
                {isSaving && isSelected ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-[#FED7AA] border-t-[#F97316]" />
                ) : isSelected ? (
                  <CheckCircle size={22} className="text-[#F97316]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
