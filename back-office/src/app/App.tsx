import React, { lazy, Suspense } from "react";
import { ConfigProvider, App as AntdApp, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./layout/AppLayout";
import { lightTheme } from "@/shared/design-system/themeConfig";
import { PageHeaderProvider } from "@/shared/lib/PageHeaderContext";
import "@/shared/lib/i18n/i18n";

// Pages - Staff+ Lazy Loading Architecture
const DashboardPage = lazy(() =>
  import("../pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const LedgerOverviewPage = lazy(() =>
  import("../pages/LedgerOverviewPage").then((m) => ({
    default: m.LedgerOverviewPage,
  })),
);
const PIMPage = lazy(() =>
  import("../pages/PIMPage").then((m) => ({ default: m.PIMPage })),
);
const InventoryPage = lazy(() =>
  import("../pages/InventoryPage").then((m) => ({ default: m.InventoryPage })),
);
const OMSPage = lazy(() =>
  import("../pages/OMSPage").then((m) => ({ default: m.OMSPage })),
);
const CRMPage = lazy(() =>
  import("../pages/CRMPage").then((m) => ({ default: m.CRMPage })),
);
const LogisticsPage = lazy(() =>
  import("../pages/LogisticsPage").then((m) => ({ default: m.LogisticsPage })),
);
const NerveCenterPage = lazy(() =>
  import("../pages/NerveCenterPage").then((m) => ({
    default: m.NerveCenterPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const ProfilePage = lazy(() =>
  import("../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const AnalyticsPage = lazy(() =>
  import("../pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const LoginPage = lazy(() =>
  import("../pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const UnauthorizedPage = lazy(() =>
  import("../pages/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  })),
);

import { ProtectedRoute } from "./routes/ProtectedRoute";

// Luxury Loader Component
const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-white space-y-6 animate-in fade-in duration-500">
    <div className="relative">
      <div className="w-16 h-16 border border-gray-100 animate-spin duration-[3000ms] ease-linear rounded-full"></div>
      <LoadingOutlined className="absolute inset-0 m-auto text-xl text-gray-300" />
    </div>
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">
        Ray Paradis
      </span>
      <span className="text-[8px] uppercase tracking-[0.2em] text-gray-300 mt-1 font-serif italic">
        Intelligence Synchronizing...
      </span>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ConfigProvider theme={lightTheme}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected Application Shell */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <PageHeaderProvider>
                        <AppLayout>
                          <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route
                              path="ledger"
                              element={
                                <ProtectedRoute permission="ledger.view">
                                  <LedgerOverviewPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="products"
                              element={
                                <ProtectedRoute permission="inventory.read">
                                  <PIMPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="orders"
                              element={
                                <ProtectedRoute permission="order.read">
                                  <OMSPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="orders/:id"
                              element={
                                <ProtectedRoute permission="order.read">
                                  <OMSPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="customers"
                              element={
                                <ProtectedRoute permission="auth.user.read">
                                  <CRMPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="inventory"
                              element={
                                <ProtectedRoute permission="inventory.read">
                                  <InventoryPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="logistics"
                              element={
                                <ProtectedRoute permission="order.shipment.manage">
                                  <LogisticsPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="analytics"
                              element={
                                <ProtectedRoute permission="dashboard.view">
                                  <AnalyticsPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="health"
                              element={
                                <ProtectedRoute permission="dashboard.view">
                                  <NerveCenterPage />
                                </ProtectedRoute>
                              }
                            />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="profile" element={<ProfilePage />} />

                            {/* Fallback for non-existent routes in shell */}
                            <Route path="*" element={<DashboardPage />} />
                          </Routes>
                        </AppLayout>
                      </PageHeaderProvider>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
