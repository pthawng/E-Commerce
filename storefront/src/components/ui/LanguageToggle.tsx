import React from 'react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';

interface LanguageToggleProps {
  isOpaque?: boolean;
}

export const LanguageToggle = ({ isOpaque }: LanguageToggleProps) => {
  const { language, setLanguage } = useStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const textClass = isOpaque ? 'text-primary' : 'text-white dark:text-foreground';
  const borderClass = isOpaque ? 'bg-primary/20' : 'bg-white/20 dark:bg-foreground/20';

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 group flex items-center gap-1.5"
      aria-label="Toggle Language"
    >
      <motion.span
        className={`font-body text-[10px] tracking-[0.2em] font-medium uppercase transition-colors duration-500 ${textClass} ${language === 'en' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}
      >
        EN
      </motion.span>
      <span className={`w-px h-2 transition-colors duration-500 ${borderClass}`} />
      <motion.span
        className={`font-body text-[10px] tracking-[0.2em] font-medium uppercase transition-colors duration-500 ${textClass} ${language === 'vi' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}
      >
        VI
      </motion.span>
    </button>
  );
};
