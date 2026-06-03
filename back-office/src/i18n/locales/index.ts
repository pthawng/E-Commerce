import viCommon from "./vi/common";
import viDashboard from "./vi/dashboard";
import viCatalog from "./vi/catalog";
import viVault from "./vi/vault";
import viAtelier from "./vi/atelier";
import viClienteling from "./vi/clienteling";
import viLedger from "./vi/ledger";
import viCms from "./vi/cms";
import viSecurity from "./vi/security";
import viAssistant from "./vi/assistant";
import viVipCare from "./vi/vipCare";

import enCommon from "./en/common";
import enDashboard from "./en/dashboard";
import enCatalog from "./en/catalog";
import enVault from "./en/vault";
import enAtelier from "./en/atelier";
import enClienteling from "./en/clienteling";
import enLedger from "./en/ledger";
import enCms from "./en/cms";
import enSecurity from "./en/security";
import enAssistant from "./en/assistant";
import enVipCare from "./en/vipCare";

import zhCommon from "./zh/common";
import zhDashboard from "./zh/dashboard";
import zhCatalog from "./zh/catalog";
import zhVault from "./zh/vault";
import zhAtelier from "./zh/atelier";
import zhClienteling from "./zh/clienteling";
import zhLedger from "./zh/ledger";
import zhCms from "./zh/cms";
import zhSecurity from "./zh/security";
import zhAssistant from "./zh/assistant";
import zhVipCare from "./zh/vipCare";

export const resources = {
  vi: {
    common: viCommon,
    dashboard: viDashboard,
    catalog: viCatalog,
    vault: viVault,
    atelier: viAtelier,
    clienteling: viClienteling,
    ledger: viLedger,
    cms: viCms,
    security: viSecurity,
    assistant: viAssistant,
    vipCare: viVipCare,
  },
  en: {
    common: enCommon,
    dashboard: enDashboard,
    catalog: enCatalog,
    vault: enVault,
    atelier: enAtelier,
    clienteling: enClienteling,
    ledger: enLedger,
    cms: enCms,
    security: enSecurity,
    assistant: enAssistant,
    vipCare: enVipCare,
  },
  zh: {
    common: zhCommon,
    dashboard: zhDashboard,
    catalog: zhCatalog,
    vault: zhVault,
    atelier: zhAtelier,
    clienteling: zhClienteling,
    ledger: zhLedger,
    cms: zhCms,
    security: zhSecurity,
    assistant: zhAssistant,
    vipCare: zhVipCare,
  },
} as const;

export type Language = "vi" | "en" | "zh";
export type Namespace = keyof typeof resources.vi;
export const SUPPORTED_LANGUAGES: Language[] = ["vi", "en", "zh"];
export const DEFAULT_LANGUAGE: Language = "vi";
export const I18N_STORAGE_KEY = "i18nextLng";
