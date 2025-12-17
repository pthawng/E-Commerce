import { Card, Statistic, Row, Col, Spin, Button } from 'antd';
import { ShoppingCartOutlined, UserOutlined, ArrowUpOutlined, FolderOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Category } from '@shared';

// Types
export interface DashboardStats {
    totalOrders: number;
    totalUsers: number;
    totalCategories: number;
    revenue: number;
}

// Helper to count categories
export const countCategories = (cats: Category[]): number => {
    if (!cats) return 0;
    return cats.reduce((acc, cat) => {
        return acc + 1 + (cat.children && cat.children.length > 0 ? countCategories(cat.children) : 0);
    }, 0);
};

// Components

export function StatsOverview({
    stats,
    isLoading
}: {
    stats: DashboardStats;
    isLoading: boolean;
}) {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
                <Card className="shadow-sm rounded-xl border-slate-100">
                    {isLoading ? (
                        <div className="text-center p-5"><Spin /></div>
                    ) : (
                        <Statistic
                            title="Total Orders"
                            value={stats.totalOrders}
                            prefix={<ShoppingCartOutlined className="text-blue-500" />}
                        />
                    )}
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card className="shadow-sm rounded-xl border-slate-100">
                    {isLoading ? (
                        <div className="text-center p-5"><Spin /></div>
                    ) : (
                        <Statistic
                            title="Total Users"
                            value={stats.totalUsers}
                            prefix={<UserOutlined className="text-purple-500" />}
                        />
                    )}
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card className="shadow-sm rounded-xl border-slate-100">
                    {isLoading ? (
                        <div className="text-center p-5"><Spin /></div>
                    ) : (
                        <Statistic
                            title="Revenue"
                            prefix="$"
                            value={stats.revenue}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            suffix={<ArrowUpOutlined />}
                        />
                    )}
                </Card>
            </Col>
        </Row>
    );
}

export function CategoryWidget({
    totalCategories,
    isLoading
}: {
    totalCategories: number;
    isLoading: boolean;
}) {
    const navigate = useNavigate();
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24}>
                <Card
                    className="shadow-sm rounded-xl border-slate-100"
                    title={
                        <div className="flex items-center gap-2 font-heading">
                            <FolderOutlined className="text-amber-500" />
                            <span>Quản lý Danh mục</span>
                        </div>
                    }
                    extra={
                        <Button
                            type="primary"
                            ghost
                            icon={<RightOutlined />}
                            onClick={() => navigate('/category')}
                        >
                            Quản lý danh mục
                        </Button>
                    }
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Statistic
                                title="Tổng số danh mục"
                                value={totalCategories}
                                prefix={<FolderOutlined />}
                                loading={isLoading}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={16}>
                            <div className="text-slate-400 text-sm">
                                Quản lý cấu trúc danh mục sản phẩm dạng cây. Tạo, chỉnh sửa và xóa danh mục để tổ chức sản phẩm một cách hiệu quả.
                            </div>
                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>
    );
}

export function UserInfoWidget({ user }: { user: any }) {
    if (!user) return null;
    return (
        <Card title={<span className="font-heading">Current User</span>} className="shadow-sm rounded-xl border-slate-100">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Full Name:</strong> {user.fullName || 'N/A'}</p>
            <p>
                <strong>Status:</strong>{' '}
                <span style={{ color: user.isActive ? '#52c41a' : '#ff4d4f' }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                </span>
            </p>
        </Card>
    );
}

export function SystemOverviewWidget({
    stats,
    isLoading
}: {
    stats: DashboardStats;
    isLoading: boolean;
}) {
    return (
        <Card title={<span className="font-heading">System Overview</span>} className="shadow-sm rounded-xl border-slate-100">
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>
                    {isLoading
                        ? 'Loading data...'
                        : `Total ${stats.totalOrders} orders in the system.`}
                </li>
                <li>
                    {isLoading
                        ? 'Loading data...'
                        : `Total ${stats.totalUsers} users registered.`}
                </li>
                <li>Backend connection status: Operational</li>
            </ul>
        </Card>
    );
}
