import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files directly
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';
import deTranslation from './locales/de/translation.json';
import itTranslation from './locales/it/translation.json';
import ptTranslation from './locales/pt/translation.json';
import ruTranslation from './locales/ru/translation.json';
import zhTranslation from './locales/zh/translation.json';
import jaTranslation from './locales/ja/translation.json';
import koTranslation from './locales/ko/translation.json';
import arTranslation from './locales/ar/translation.json';
import heTranslation from './locales/he/translation.json';
import hiTranslation from './locales/hi/translation.json';
import trTranslation from './locales/tr/translation.json';
import viTranslation from './locales/vi/translation.json';
import thTranslation from './locales/th/translation.json';
import idTranslation from './locales/id/translation.json';
import plTranslation from './locales/pl/translation.json';
import nlTranslation from './locales/nl/translation.json';
import svTranslation from './locales/sv/translation.json';
import ukTranslation from './locales/uk/translation.json';
import daTranslation from './locales/da/translation.json';
import fiTranslation from './locales/fi/translation.json';
import noTranslation from './locales/no/translation.json';
import elTranslation from './locales/el/translation.json';
import csTranslation from './locales/cs/translation.json';
import roTranslation from './locales/ro/translation.json';
import huTranslation from './locales/hu/translation.json';
import bnTranslation from './locales/bn/translation.json';

// Supported languages with RTL support
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', rtl: false },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false },
  fr: { name: 'French', nativeName: 'Français', rtl: false },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false },
  it: { name: 'Italian', nativeName: 'Italiano', rtl: false },
  pt: { name: 'Portuguese', nativeName: 'Português', rtl: false },
  ru: { name: 'Russian', nativeName: 'Русский', rtl: false },
  zh: { name: 'Chinese', nativeName: '中文', rtl: false },
  ja: { name: 'Japanese', nativeName: '日本語', rtl: false },
  ko: { name: 'Korean', nativeName: '한국어', rtl: false },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
  he: { name: 'Hebrew', nativeName: 'עברית', rtl: true },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  bn: { name: 'Bengali', nativeName: 'বাংলা', rtl: false },
  tr: { name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
  th: { name: 'Thai', nativeName: 'ไทย', rtl: false },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
  pl: { name: 'Polish', nativeName: 'Polski', rtl: false },
  nl: { name: 'Dutch', nativeName: 'Nederlands', rtl: false },
  sv: { name: 'Swedish', nativeName: 'Svenska', rtl: false },
  da: { name: 'Danish', nativeName: 'Dansk', rtl: false },
  fi: { name: 'Finnish', nativeName: 'Suomi', rtl: false },
  no: { name: 'Norwegian', nativeName: 'Norsk', rtl: false },
  el: { name: 'Greek', nativeName: 'Ελληνικά', rtl: false },
  cs: { name: 'Czech', nativeName: 'Čeština', rtl: false },
  ro: { name: 'Romanian', nativeName: 'Română', rtl: false },
  hu: { name: 'Hungarian', nativeName: 'Magyar', rtl: false },
  uk: { name: 'Ukrainian', nativeName: 'Українська', rtl: false },
};

// Machine translation API (using LibreTranslate or similar)
const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    // For now, return original text - you can integrate a translation service
    // Options: LibreTranslate, Google Translate API, DeepL API, etc.
    // Example with LibreTranslate:
    // const response = await fetch('https://libretranslate.com/translate', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     q: text,
    //     source: 'en',
    //     target: targetLang,
    //     format: 'text'
    //   }),
    //   headers: { 'Content-Type': 'application/json' }
    // });
    // const data = await response.json();
    // return data.translatedText;
    
    return text; // Placeholder - returns original text
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation },
      fr: { translation: frTranslation },
      de: { translation: deTranslation },
      it: { translation: itTranslation },
      pt: { translation: ptTranslation },
      ru: { translation: ruTranslation },
      zh: { translation: zhTranslation },
      ja: { translation: jaTranslation },
      ko: { translation: koTranslation },
      ar: { translation: arTranslation },
      he: { translation: heTranslation },
      hi: { translation: hiTranslation },
      tr: { translation: trTranslation },
      vi: { translation: viTranslation },
      th: { translation: thTranslation },
      id: { translation: idTranslation },
      pl: { translation: plTranslation },
      nl: { translation: nlTranslation },
      sv: { translation: svTranslation },
      uk: { translation: ukTranslation },
      da: { translation: daTranslation },
      fi: { translation: fiTranslation },
      no: { translation: noTranslation },
      el: { translation: elTranslation },
      cs: { translation: csTranslation },
      ro: { translation: roTranslation },
      hu: { translation: huTranslation },
      bn: { translation: bnTranslation },
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

export { translateText };
export default i18n;
