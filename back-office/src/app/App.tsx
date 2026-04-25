import { ConfigProvider, App as AntdApp } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layout/AppLayout';
import { lightTheme } from '@/shared/design-system/themeConfig';
import { PageHeaderProvider } from '@/shared/lib/PageHeaderContext';
import '@/shared/lib/i18n/i18n';

// Pages
import { DashboardPage } from '../pages/DashboardPage';
import { LedgerOverviewPage } from '../pages/LedgerOverviewPage';
import { PIMPage } from '../pages/PIMPage';
import { OMSPage } from '../pages/OMSPage';
import { CRMPage } from '../pages/CRMPage';
import { ConciergePage } from '../pages/ConciergePage';
import { LogisticsPage } from '../pages/LogisticsPage';
import { NerveCenterPage } from '../pages/NerveCenterPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

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
                                                    <Route path="ledger" element={<ProtectedRoute permission="ledger.view"><LedgerOverviewPage /></ProtectedRoute>} />
                                                    <Route path="products" element={<ProtectedRoute permission="inventory.view"><PIMPage /></ProtectedRoute>} />
                                                    <Route path="orders" element={<ProtectedRoute permission="order.view"><OMSPage /></ProtectedRoute>} />
                                                    <Route path="customers" element={<ProtectedRoute permission="customer.view"><CRMPage /></ProtectedRoute>} />
                                                    <Route path="logistics" element={<ProtectedRoute permission="logistics.view"><LogisticsPage /></ProtectedRoute>} />
                                                    <Route path="health" element={<ProtectedRoute permission="system.health"><NerveCenterPage /></ProtectedRoute>} />
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
                    </Router>
                </QueryClientProvider>
            </AntdApp>
        </ConfigProvider>
    );
};

export default App;
