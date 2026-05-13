import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ko } from './locales/ko';
import { en } from './locales/en';
import { ja } from './locales/ja';
import { es } from './locales/es';

const LANGUAGE_STORAGE_KEY = 'errander_language';

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  '한국어': 'ko',
  English: 'en',
  '日本語': 'ja',
  '中文 (简体)': 'zh-cn',
  '繁體中文': 'zh-tw',
  Español: 'es',
  Français: 'fr',
};

export function getLanguageCode(languageName: string | undefined): string {
  return LANGUAGE_CODE_MAP[languageName ?? ''] ?? 'ko';
}

export function loadSavedLanguage(): string {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'ko';
  } catch {
    return 'ko';
  }
}

export function saveLanguage(code: string) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Android WebView can temporarily reject storage access during bootstrap.
  }
}

export async function changeAppLanguage(languageName: string) {
  const code = getLanguageCode(languageName);
  saveLanguage(code);
  await i18n.changeLanguage(code);
}

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    ja: { translation: ja },
    es: { translation: es },
  },
  lng: loadSavedLanguage(),
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

export default i18n;
