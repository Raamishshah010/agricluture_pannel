import { useState, useEffect } from 'react';
import useStore from '../store/store';
import enTranslations from '../locales/translations.json';
import arTranslations from '../locales/arabic.json';

const translations = {
  en: enTranslations,
  ar: arTranslations
};

export const useTranslation = () => {
  const { language } = useStore();
  const [t, setT] = useState(() => (key) => {
    const keys = key.split('.');
    let value = translations[language] || translations.en;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    return typeof value === 'string' ? value : key;
  });

  useEffect(() => {
    setT(() => (key) => {
      const keys = key.split('.');
      let value = translations[language] || translations.en;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }
      
      return typeof value === 'string' ? value : key;
    });
  }, [language]);

  return t;
};

export default useTranslation;