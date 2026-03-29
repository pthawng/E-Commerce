import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useStore();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 text-muted-foreground hover:text-foreground transition-colors duration-500"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <AnimatePresence mode="wait">
        {theme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sun className="w-4 h-4" strokeWidth={1.2} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Moon className="w-4 h-4" strokeWidth={1.2} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const LanguageToggle = () => {
  const { language, currency, setLanguage } = useStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-body tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-500"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="hidden sm:inline text-muted-foreground/60">({currency})</span>
      <span className="hidden sm:inline text-muted-foreground/30">-</span>
      <span>{language.toUpperCase()}</span>
    </motion.button>
  );
};
