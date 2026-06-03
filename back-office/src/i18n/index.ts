import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, DEFAULT_LANGUAGE, I18N_STORAGE_KEY, type Language } from "./locales";

/**
 * i18n configuration for Ray Paradis Back-office
 *
 * SSR Safety Strategy:
 * - Server + First Render always use 'vi' (DEFAULT_LANGUAGE) to prevent
 *   HTML hydration mismatch between server and client.
 * - After client hydration (in __root.tsx useEffect), we read localStorage
 *   and call i18n.changeLanguage() only if needed.
 */
i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: ["vi", "en", "zh"],
  ns: [
    "common",
    "dashboard",
    "catalog",
    "vault",
    "atelier",
    "clienteling",
    "ledger",
    "cms",
    "security",
    "assistant",
    "vipCare",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  // Disable browser detection — we handle it manually post-hydration
  detection: undefined,
  react: {
    useSuspense: false,
  },
});

/**
 * Called once after client hydration to sync language from localStorage.
 * Must be called inside a useEffect to avoid SSR mismatch.
 */
export function syncLanguageFromStorage(): void {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(I18N_STORAGE_KEY) as Language | null;
  if (saved && saved !== i18n.language && ["vi", "en", "zh"].includes(saved)) {
    void i18n.changeLanguage(saved);
  }
}

/**
 * Change language and persist to localStorage.
 */
export function changeLanguage(lang: Language): void {
  void i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    localStorage.setItem(I18N_STORAGE_KEY, lang);
  }
}

export { i18n as default };
