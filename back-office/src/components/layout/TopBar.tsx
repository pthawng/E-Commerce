import { Bell, Command, Search, ChevronRight, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";
import type { Language } from "@/i18n/locales";

type RouteKey =
  | "/"
  | "/commerce"
  | "/vault"
  | "/atelier"
  | "/vip-care"
  | "/ledger"
  | "/cms"
  | "/back-office/settings/security"
  | "/back-office/staff"
  | "/assistant";

const ROUTE_KEYS: RouteKey[] = [
  "/",
  "/commerce",
  "/vault",
  "/atelier",
  "/vip-care",
  "/ledger",
  "/cms",
  "/back-office/settings/security",
  "/back-office/staff",
  "/assistant",
];

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "vi", label: "VI" },
  { code: "en", label: "EN" },
  { code: "zh", label: "ZH" },
];

export function TopBar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { t, i18n } = useTranslation("common");
  const activeLang = i18n.language as Language;

  // Determine route key — fallback to "/" for unrecognized paths
  const routeKey = pathname.startsWith("/vip-care")
    ? "/vip-care"
    : ROUTE_KEYS.includes(pathname as RouteKey)
      ? (pathname as RouteKey)
      : "/";
  const routeMeta = t(`topbar.routes.${routeKey}`, { returnObjects: true }) as {
    crumbs: string[];
    sub: string;
  };
  const crumbs = Array.isArray(routeMeta?.crumbs) ? routeMeta.crumbs : ["Maison"];
  const sub = routeMeta?.sub ?? "";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="h-14 flex items-center gap-4 px-6">
        <SidebarTrigger className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground" />

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
              <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>
                {c}
              </span>
            </span>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Language Switcher */}
        <div className="flex items-center gap-0.5 border border-border rounded-md px-1 py-0.5 bg-surface">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`text-[10.5px] font-mono tracking-widest px-2 py-0.5 rounded transition-colors
                ${
                  activeLang === lang.code
                    ? "bg-gold/20 text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label={`Switch to ${lang.label}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <button className="group flex items-center gap-2 h-9 w-64 px-3 rounded-md border border-border bg-surface hover:border-border-strong transition text-left">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 text-[12.5px] text-muted-foreground">{t("topbar.search")}</span>
          <kbd className="text-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 flex items-center gap-0.5">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Ask AI */}
        <button className="h-9 px-3 rounded-md border border-border bg-surface hover:bg-accent transition flex items-center gap-2 text-[12.5px]">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <span>{t("topbar.askAI")}</span>
        </button>

        {/* Notifications */}
        <button className="relative h-9 w-9 rounded-md border border-border bg-surface hover:bg-accent transition flex items-center justify-center">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-gold" />
        </button>
      </div>

      {sub && (
        <div className="px-6 pb-2.5 -mt-1 text-[11px] text-muted-foreground/80 tracking-wide">
          {sub}
        </div>
      )}
    </header>
  );
}
