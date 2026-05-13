export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-cn', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'zh-tw', name: '繁體中文', flag: '🇹🇼' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];
