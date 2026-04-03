import React, { createContext, useState, useEffect, useContext } from 'react';

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('mc_lang') || 'en');
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const res = await fetch(`/locales/${lang}.json`);
        if (res.ok) {
          const data = await res.json();
          setTranslations(data);
          localStorage.setItem('mc_lang', lang);
          document.documentElement.lang = lang;
          // Notify other components (like Speech recognition) if they listen globally
          window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
        } else {
          console.error(`Failed to load ${lang} locale`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTranslations();
  }, [lang]);

  const t = React.useCallback((key) => {
    if (!key) return '';
    try {
      const keys = key.split('.');
      let val = translations;
      for (const k of keys) {
        if (!val || val[k] === undefined) return key;
        val = val[k];
      }
      return val || key;
    } catch {
      return key;
    }
  }, [translations]);

  const setLanguage = (newLang) => setLang(newLang);

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t, translations }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
