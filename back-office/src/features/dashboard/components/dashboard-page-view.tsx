import { Alert } from 'antd';
import { ShoppingOutlined, UserOutlined, AppstoreOutlined, DollarOutlined } from '@ant-design/icons';
import { useUsers } from '@/features/user';
import { useOrders } from '@/features/order';
import { useMe } from '@/features/auth';
import { useCategories } from '@/features/category';
import { PageHeader, KPICard } from '@/shared/ui';
import { contentContainerStyle } from '@/ui/styles';
import * as tokens from '@/ui/design-tokens';

// Helper to count categories recursively
const countCategories = (categories: any[]): number => {
    if (!categories || categories.length === 0) return 0;
    return categories.reduce((count, cat) => {
        return count + 1 + countCategories(cat.children || []);
    }, 0);
};

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

    const stats = {
        totalOrders: ordersData?.meta?.total || 0,
        totalUsers: usersData?.meta?.total || 0,
        totalCategories: countCategories(categories || []),
        revenue: 0, // TODO: Implement revenue calculation
    };

    const isLoading = usersLoading || ordersLoading || meLoading || categoriesLoading;
    const hasError = usersError || ordersError || meError || categoriesError;

    return (
        <div>
            {/* Page Header */}
            <PageHeader
                title="Dashboard"
                subtitle={currentUser ? `Welcome back, ${currentUser.email}` : 'Overview'}
            />

            {/* Error Alert */}
            {hasError && (
                <div style={{
                    padding: `${tokens.spacing.md}px ${tokens.spacing.xxl}px`,
                    backgroundColor: tokens.neutral.background,
                }}>
                    <Alert
                        message="Failed to load data"
                        description={
                            usersError ? String(usersError) : ordersError ? String(ordersError) : 'Unknown error'
                        }
                        type="error"
                        showIcon
                        closable
                        style={{
                            maxWidth: 1400,
                            margin: '0 auto',
                            borderRadius: 4,
                            border: '1px solid #F5EDED',
                            backgroundColor: '#FEF5F5',
                        }}
                    />
                </div>
            )}

            {/* Content */}
            <div style={contentContainerStyle}>
                {/* KPI Cards Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: tokens.spacing.lg,
                    marginBottom: tokens.spacing.xxl,
                }}>
                    <KPICard
                        title="Total Orders"
                        value={stats.totalOrders.toLocaleString()}
                        icon={<ShoppingOutlined />}
                        isLoading={ordersLoading}
                    />
                    <KPICard
                        title="Total Users"
                        value={stats.totalUsers.toLocaleString()}
                        icon={<UserOutlined />}
                        isLoading={usersLoading}
                    />
                    <KPICard
                        title="Categories"
                        value={stats.totalCategories.toLocaleString()}
                        icon={<AppstoreOutlined />}
                        isLoading={categoriesLoading}
                    />
                    <KPICard
                        title="Revenue"
                        value="Coming soon"
                        icon={<DollarOutlined />}
                        isLoading={false}
                    />
                </div>

                {/* Recent Activity Widget */}
                <div style={{
                    backgroundColor: tokens.neutral.surface,
                    border: `1px solid ${tokens.neutral.borderLight}`,
                    borderRadius: tokens.component.borderRadius.base,
                    padding: tokens.spacing.xxl,
                }}>
                    <h3 style={{
                        fontSize: tokens.typography.fontSize.lg,
                        fontWeight: tokens.typography.fontWeight.medium,
                        color: tokens.neutral.textPrimary,
                        marginTop: 0,
                        marginBottom: tokens.spacing.lg,
                    }}>
                        Recent Activity
                    </h3>
                    <div style={{
                        padding: '40px 0',
                        textAlign: 'center',
                        color: tokens.neutral.textTertiary,
                        fontSize: tokens.typography.fontSize.base,
                    }}>
                        Activity tracking coming soon
                    </div>
                </div>
            </div>
        </div>
    );
}
