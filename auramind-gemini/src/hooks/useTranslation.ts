import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Enhanced translation hook with additional utilities
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
    isRTL: document.documentElement.dir === 'rtl',
  };
};

export default useTranslation;
