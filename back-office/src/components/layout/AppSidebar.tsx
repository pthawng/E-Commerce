import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ShoppingBag,
  Warehouse,
  Hammer,
  Crown,
  Receipt,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Gem,
  Users,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";
import type { Language } from "@/i18n/locales";
import { backOfficeFetch } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";

const NAV_ITEMS = {
  overview: [{ key: "executive" as const, url: "/", icon: LayoutDashboard }],
  operations: [
    { key: "commerce" as const, url: "/commerce", icon: ShoppingBag },
    { key: "vault" as const, url: "/vault", icon: Warehouse },
    { key: "atelier" as const, url: "/atelier", icon: Hammer },
  ],
  clients: [
    { key: "clienteling" as const, url: "/vip-care", icon: Crown },
    { key: "ledger" as const, url: "/ledger", icon: Receipt },
  ],
  studio: [{ key: "cms" as const, url: "/cms", icon: BookOpen }],
  governance: [
    { key: "security" as const, url: "/back-office/settings/security", icon: ShieldCheck },
    { key: "staff" as const, url: "/back-office/staff", icon: Users },
    { key: "assistant" as const, url: "/assistant", icon: Sparkles },
  ],
};

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "vi", label: "VI" },
  { code: "en", label: "EN" },
  { code: "zh", label: "ZH" },
];

type SidebarUser = {
  fullName?: string | null;
  staffProfile?: {
    department?: string | null;
  } | null;
};

function Section({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string;
  items: { key: string; url: string; icon: React.ElementType }[];
  pathname: string;
  collapsed: boolean;
}) {
  const { t } = useTranslation("common");

  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 px-3 mt-3 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active =
              pathname === item.url ||
              (item.url === "/vip-care" && pathname.startsWith("/vip-care"));
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="group relative h-9 rounded-md data-[active=true]:bg-accent data-[active=true]:text-foreground hover:bg-accent/60"
                >
                  <Link to={item.url} className="flex items-center gap-3 px-3">
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-gold rounded-full" />
                    )}
                    <item.icon
                      className={`h-4 w-4 ${active ? "text-gold" : "text-muted-foreground group-hover:text-foreground"}`}
                    />
                    {!collapsed && (
                      <span className="text-[13px] font-medium tracking-tight">
                        {t(`nav.items.${item.key}`)}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { t, i18n } = useTranslation("common");
  const activeLang = i18n.language as Language;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-14 flex-row items-center px-4">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-md gold-gradient flex items-center justify-center">
            <Gem className="h-4 w-4 text-background" strokeWidth={2.25} />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-display text-[15px] font-semibold tracking-wide">
                {t("brand.name")}
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("brand.subtitle")}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 scrollbar-thin">
        <Section
          label={t("nav.overview")}
          items={NAV_ITEMS.overview}
          pathname={pathname}
          collapsed={collapsed}
        />
        <Section
          label={t("nav.operations")}
          items={NAV_ITEMS.operations}
          pathname={pathname}
          collapsed={collapsed}
        />
        <Section
          label={t("nav.clientsFinance")}
          items={NAV_ITEMS.clients}
          pathname={pathname}
          collapsed={collapsed}
        />
        <Section
          label={t("nav.studio")}
          items={NAV_ITEMS.studio}
          pathname={pathname}
          collapsed={collapsed}
        />
        <Section
          label={t("nav.governance")}
          items={NAV_ITEMS.governance}
          pathname={pathname}
          collapsed={collapsed}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        {/* Language Switcher */}
        <div
          className={`flex ${collapsed ? "flex-col items-center" : "items-center justify-center"} gap-1`}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded transition-colors
                ${
                  activeLang === lang.code
                    ? "text-gold border border-gold/40 bg-gold/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label={`Switch to ${lang.label}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* User Footer */}
        <UserFooter collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { data: user } = useQuery<SidebarUser>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.ME);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const body = await res.json();
      return body.data;
    },
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.LOGOUT, { method: "POST" });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        navigate({ to: "/back-office/login" });
      }
    }
  };

  const name = user?.fullName || "Chưa cập nhật";
  const dept = user?.staffProfile?.department || "Maison";

  const getInitials = (n: string) => {
    const parts = n.split(" ");
    return parts
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  const initials = getInitials(name);

  if (collapsed) {
    return (
      <Link
        to="/back-office/settings/security"
        className="h-8 w-8 mx-auto rounded-full bg-muted border border-border-strong flex items-center justify-center text-[11px] font-medium text-foreground hover:bg-accent/60 transition"
        title={`${name} (${dept})`}
      >
        {initials}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/60 transition group relative">
      <Link to="/back-office/settings/security" className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-muted to-surface-raised border border-border-strong flex items-center justify-center text-[11px] font-medium text-foreground shrink-0">
          {initials}
        </div>
        <div className="flex-1 leading-tight min-w-0">
          <div className="text-[12.5px] font-medium truncate text-foreground">{name}</div>
          <div className="text-[10.5px] text-muted-foreground truncate">{dept}</div>
        </div>
      </Link>
      <button
        onClick={handleLogout}
        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
        title="Đăng xuất"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
