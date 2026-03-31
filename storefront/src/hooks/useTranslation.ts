import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { createTranslationFn } from '@/utils/i18n.utils';

export const useTranslation = () => {
  const { language, setLanguage, formatPrice } = useStore();

  const t = useMemo(() => {
    const currentTranslations = translations[language];
    const defaultTranslations = translations['en'];
    return createTranslationFn(currentTranslations, defaultTranslations, language);
  }, [language]);

  return { t, language, setLanguage, formatPrice };
};
