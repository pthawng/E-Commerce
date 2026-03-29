import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';

export const useTranslation = () => {
  const { language } = useStore();

  const t = translations[language];

  return { t, language };
};
