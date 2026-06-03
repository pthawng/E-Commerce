import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { backOfficeFetch } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";
import { AlertTriangle } from "lucide-react";

// Side-effect import: initialises i18next with all resources
import "@/i18n";
import { syncLanguageFromStorage } from "@/i18n";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-7xl">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Hành lang này của Maison không tồn tại.
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-2xl">Đã xảy ra sự cố trong không gian làm việc</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ray Paradis — Trung tâm Vận hành" },
      {
        name: "description",
        content: "Hệ thống vận hành nội bộ của thương hiệu trang sức xa xỉ Ray Paradis.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // SSR-safe: sync language from localStorage ONLY after client hydration.
  // Server always renders with 'vi' (DEFAULT_LANGUAGE) so HTML matches.
  useEffect(() => {
    syncLanguageFromStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthRoute =
    location.pathname.startsWith("/back-office/login") ||
    location.pathname === "/back-office/accept-invitation" ||
    location.pathname === "/back-office/setup-mfa";

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.ME);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("Failed to fetch user profile");
      }
      const responseData = await res.json();
      return responseData.data;
    },
    enabled: !isAuthRoute,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isAuthRoute && error?.message === "UNAUTHORIZED") {
      navigate({ to: "/back-office/login" });
    }
  }, [isAuthRoute, error, navigate]);

  useEffect(() => {
    if (isAuthRoute && user) {
      navigate({ to: "/" });
    }
  }, [isAuthRoute, user, navigate]);

  if (!isAuthRoute && error && error.message !== "UNAUTHORIZED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center bg-surface border border-destructive/30 rounded-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-destructive" />
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-display text-xl font-medium text-foreground">
            Không thể kết nối đến Máy chủ
          </h1>
          <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">
            Hệ thống vận hành không thể kết nối đến máy chủ điều hành (Backend). Vui lòng kiểm tra
            lại dịch vụ NestJS hoặc đường truyền mạng.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center rounded bg-destructive hover:bg-destructive/90 text-white px-4 py-2 text-[12px] font-medium transition cursor-pointer"
          >
            Thử kết nối lại
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthRoute && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="text-[12px] uppercase tracking-[0.2em] text-gold animate-pulse">
            Đang xác thực phiên làm việc...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Outlet />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <TopBar />
          <main className="flex-1 overflow-auto scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
