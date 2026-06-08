import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeIcon as Globe, CheckIcon as Check } from '../icons/CustomIcons';
import { SUPPORTED_LANGUAGES } from '../../i18n/config';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const currentLang = i18n.language;

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    // Update document direction for RTL languages
    const langInfo = SUPPORTED_LANGUAGES[langCode as keyof typeof SUPPORTED_LANGUAGES];
    if (langInfo?.rtl) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = langCode;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = langCode;
    }
  };

  const currentLangInfo = SUPPORTED_LANGUAGES[currentLang as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES.en;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-arch-fg hover:bg-arch-fg/10 rounded-lg transition-colors"
      >
        <Globe size={16} />
        <span>{currentLangInfo.nativeName}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-arch-bg border border-arch-border rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    currentLang === code
                      ? 'bg-arch-fg/10 text-arch-fg'
                      : 'text-arch-muted hover:bg-arch-fg/5 hover:text-arch-fg'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {info.rtl && <span className="text-xs">RTL</span>}
                    <span>{info.nativeName}</span>
                  </span>
                  {currentLang === code && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;



