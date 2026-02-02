import React, { createContext, useContext, useEffect, useState } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('app_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_lang', lang);
    } catch (e) {}
  }, [lang]);

  const t = (key, fallback) => {
    const ns = translations[lang] || translations.en || {};
    return ns[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
