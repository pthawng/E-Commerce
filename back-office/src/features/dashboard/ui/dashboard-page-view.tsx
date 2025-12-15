import { Alert } from 'antd';
import { useUsers } from '@/features/user';
import { useOrders } from '@/features/order';
import { useMe } from '@/features/auth';
// Fix: categories hook was in services, now in features/category
// But I need to check where useCategories is exported.
// Refactor Category Step 410: features/category/api/queries.ts exported useCategories.
// features/category/index.ts exports * from api/queries.
import { useCategories } from '@/features/category';

import { ErrorBoundary } from '@/shared/ui';
import {
    StatsOverview,
    CategoryWidget,
    UserInfoWidget,
    SystemOverviewWidget,
    countCategories,
    type DashboardStats
} from './widgets';

export function DashboardPageView() {
    const {
        data: usersData,
        isLoading: usersLoading,
        error: usersError
    } = useUsers({ limit: 1 });

    const {
        data: ordersData,
        isLoading: ordersLoading,
        error: ordersError
    } = useOrders({ limit: 1 });

    const {
        data: currentUser,
        isLoading: meLoading,
        error: meError
    } = useMe();

    const {
        data: categories,
        isLoading: categoriesLoading,
        error: categoriesError,
    } = useCategories(true);

    const stats: DashboardStats = {
        totalOrders: ordersData?.meta?.total || 0,
        totalUsers: usersData?.meta?.total || 0,
        totalCategories: countCategories(categories || []),
        revenue: 0, // TODO: Implement revenue calculation
    };

    const isLoading = usersLoading || ordersLoading || meLoading || categoriesLoading;
    const hasError = usersError || ordersError || meError || categoriesError;

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold font-heading text-slate-800">Dashboard</h1>

                {hasError && (
                    <Alert
                        message="Lỗi kết nối API"
                        description={
                            usersError ? String(usersError) : ordersError ? String(ordersError) : 'Unknown error'
                        }
                        type="error"
                        showIcon
                        closable
                        className="rounded-xl border-red-200 bg-red-50 text-red-800"
                    />
                )}

                <StatsOverview stats={stats} isLoading={isLoading} />

                <CategoryWidget totalCategories={stats.totalCategories} isLoading={categoriesLoading} />

                {currentUser && <UserInfoWidget user={currentUser} />}

                <SystemOverviewWidget stats={stats} isLoading={isLoading} />
            </div>
        </ErrorBoundary>
    );
}
