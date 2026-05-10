import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhCn from './locales/zh-cn.json';
import zhTw from './locales/zh-tw.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const LANGUAGE_STORAGE_KEY = '@errander_language';

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  '한국어': 'ko',
  'English': 'en',
  '日本語': 'ja',
  '中文 (简体)': 'zh-cn',
  '繁體中文': 'zh-tw',
  'Español': 'es',
  'Français': 'fr',
};

export const LANGUAGE_NAME_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_CODE_MAP).map(([name, code]) => [code, name])
);

export async function loadSavedLanguage(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved ?? 'ko';
  } catch {
    return 'ko';
  }
}

export async function saveLanguage(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {}
}

export async function changeAppLanguage(languageName: string): Promise<void> {
  const code = LANGUAGE_CODE_MAP[languageName] ?? 'ko';
  await saveLanguage(code);
  await i18n.changeLanguage(code);
}

i18n.use(initReactI18next).init({
  resources: {
    ko:    { translation: ko },
    en:    { translation: en },
    ja:    { translation: ja },
    'zh-cn': { translation: zhCn },
    'zh-tw': { translation: zhTw },
    es:    { translation: es },
    fr:    { translation: fr },
  },
  lng: 'ko',
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

export default i18n;
