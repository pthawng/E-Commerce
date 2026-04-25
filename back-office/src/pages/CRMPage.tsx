import React, { useState } from 'react';
import {
    Typography, Tabs, Table, Tag, Space, Button, Card, Row, Col, Statistic, Input,
    Badge, Modal, Form, Select, Switch, message, Tooltip, Empty, Spin, Avatar,
    Progress, Divider
} from 'antd';
import {
    PlusOutlined, SearchOutlined, UserOutlined, MailOutlined, PhoneOutlined,
    ShoppingOutlined, TrophyOutlined, TeamOutlined, HeartOutlined,
    CustomerServiceOutlined, MessageOutlined, EllipsisOutlined,
    ArrowUpOutlined, ArrowDownOutlined, GlobalOutlined, StarFilled,
    EyeOutlined, WarningOutlined, CrownOutlined, RiseOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { customerApi, CustomerListItem, maskPII } from '../shared/api/customerApi';
import { orderApi } from '../shared/api/orderApi';
import { CustomerProfileDrawer } from '../shared/ui/CustomerProfileDrawer';

const { Title, Text } = Typography;

// ============================================
// TAB 1: CLIENT DIRECTORY
// ============================================
const ClientDirectoryTab: React.FC = () => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { data: customers, isLoading } = useQuery({
        queryKey: ['crm-customers', page, search],
        queryFn: () => customerApi.getCustomers({ page, limit: 15, search: search || undefined }),
    });

    const formatVND = (value: number | undefined) => {
        if (value === undefined) return '0 ₫';
        return Number(value).toLocaleString('vi-VN') + ' ₫';
    };

    const handleView = (id: string) => {
        setSelectedCustomerId(id);
        setDrawerOpen(true);
    };

    const columns = [
        {
            title: 'Client',
            key: 'client',
            render: (_: any, record: CustomerListItem) => (
                <Space
                    size={12}
                    className="cursor-pointer hover:bg-gray-50/50 transition-colors p-1 -m-1 rounded"
                    onClick={() => handleView(record.id)}
                >
                    <Avatar src={record.avatarUrl} icon={<UserOutlined />} className="bg-gray-100" />
                    <div>
                        <Text strong className="block text-sm font-serif">{record.fullName || 'Anonymous'}</Text>
                        <Text className="text-[10px] text-gray-400 uppercase tracking-widest">{maskPII(record.email, 'email')}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Relationship',
            key: 'segment',
            render: (_: any, record: CustomerListItem) => {
                const segment = record.segment || 'PROSPECT';
                const isVIP = segment === 'VIP';
                const isLoyal = segment === 'LOYAL';
                const isActive = segment === 'ACTIVE';

                return (
                    <Tag
                        color={isVIP ? 'gold' : isLoyal ? 'blue' : isActive ? 'green' : 'default'}
                        className="rounded-none border-none text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 m-0"
                    >
                        {isVIP ? <TrophyOutlined className="mr-1" /> : null}
                        {segment === 'VIP' ? 'VIP High Roller' : segment}
                    </Tag>
                );
            },
        },
        {
            title: 'Engagement',
            key: 'engagement',
            render: (_: any, record: CustomerListItem) => {
                const orderCount = record.orderCount ?? 0;
                const ltv = record.ltv ?? 0;

                return (
                    <div className="space-y-1">
                        <Tooltip title="Lifetime Orders">
                            <Space size={4} className="text-[10px] font-bold text-gray-400">
                                <ShoppingOutlined className="text-gray-300" /> {orderCount} Orders
                            </Space>
                        </Tooltip>
                        <br />
                        <Tooltip title="Lifetime Value (LTV)">
                            <Text className="text-xs font-serif text-amber-600 font-medium">
                                {formatVND(ltv)}
                            </Text>
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: CustomerListItem) => (
                <Space size={4}>
                    <Badge status={record.isActive ? 'success' : 'default'} />
                    <Text className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
                        {record.isActive ? 'Active' : 'Dormant'}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Last Touch',
            key: 'lastOrder',
            render: (_: any, record: CustomerListItem) => (
                <Text className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleDateString('vi-VN') : '—'}
                </Text>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Input
                    prefix={<SearchOutlined className="text-gray-300" />}
                    placeholder="Search by name, email, or segment..."
                    className="h-10 w-80 border-gray-100 bg-transparent rounded-none"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    allowClear
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 px-6 bg-black border-none uppercase tracking-widest text-[9px] font-bold"
                >
                    Add Private Account
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={customers?.items || []}
                loading={isLoading}
                rowKey="id"
                pagination={{
                    current: page,
                    pageSize: 15,
                    total: customers?.meta?.total || 0,
                    onChange: setPage,
                    showSizeChanger: false,
                    position: ['bottomCenter'],
                }}
                className="luxury-table"
            />

            <CustomerProfileDrawer
                customerId={selectedCustomerId}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
        </div>
    );
};

// ============================================
// GUEST ORDERS MODAL
// ============================================
const GuestOrdersModal: React.FC<{
    email: string | null;
    open: boolean;
    onClose: () => void;
}> = ({ email, open, onClose }) => {
    const { data: orders, isLoading } = useQuery({
        queryKey: ['crm-guest-orders', email],
        queryFn: () => email ? orderApi.getOrders({ guestEmail: email, limit: 50 }) : null,
        enabled: !!email && open,
    });

    const formatVND = (value: number | undefined) => {
        if (value === undefined) return '0 ₫';
        return Number(value).toLocaleString('vi-VN') + ' ₫';
    };

    return (
        <Modal
            title={
                <Space>
                    <HistoryOutlined className="text-amber-600" />
                    <span className="font-serif">Guest Order History</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={700}
            className="luxury-modal"
        >
            <div className="mb-6 p-4 bg-amber-50/30 border border-amber-100/50">
                <Text className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Guest Identity</Text>
                <Text strong className="text-sm font-serif">{email || '—'}</Text>
            </div>

            <Table
                dataSource={orders?.items || []}
                loading={isLoading}
                rowKey="id"
                pagination={false}
                scroll={{ y: 400 }}
                columns={[
                    {
                        title: 'Order',
                        dataIndex: 'code',
                        key: 'code',
                        render: (v: string) => <Text className="font-serif text-xs font-bold">{v}</Text>
                    },
                    {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (v: string) => (
                            <Tag className="text-[9px] uppercase font-bold tracking-widest border-none bg-blue-50 text-blue-600 px-2 py-0.5">
                                {v}
                            </Tag>
                        )
                    },
                    {
                        title: 'Amount',
                        dataIndex: 'totalAmount',
                        key: 'totalAmount',
                        render: (v: number) => <Text className="font-serif text-xs text-amber-600">{formatVND(v)}</Text>
                    },
                    {
                        title: 'Date',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        render: (v: string) => <Text className="text-[10px] text-gray-400 font-bold">{new Date(v).toLocaleDateString('vi-VN')}</Text>
                    }
                ]}
                locale={{ emptyText: <Empty description="No orders found for this guest." /> }}
            />
        </Modal>
    );
};

// ============================================
// TAB 2: GUEST REGISTRY
// ============================================
const GuestRegistryTab: React.FC = () => {
    const [page, setPage] = useState(1);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: guests, isLoading } = useQuery({
        queryKey: ['crm-guests', page],
        queryFn: () => customerApi.getGuests({ page, limit: 15 }),
    });

    const formatVND = (value: number | undefined) => {
        if (value === undefined) return '0 ₫';
        return Number(value).toLocaleString('vi-VN') + ' ₫';
    };

    const handleViewOrders = (email: string) => {
        setSelectedEmail(email);
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'Guest Identity',
            key: 'identity',
            render: (_: any, record: any) => (
                <Space size={12}>
                    <Avatar icon={<GlobalOutlined />} className="bg-amber-50 text-amber-600" />
                    <div>
                        <Text strong className="block text-sm font-serif">{maskPII(record.email, 'email')}</Text>
                        <Text className="text-[9px] text-gray-400 uppercase tracking-widest">Anonymized Shopper</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Relationship',
            key: 'segment',
            render: (_: any, record: any) => {
                const isVIP = record.segment?.includes('VIP');
                const isLoyal = record.segment?.includes('LOYAL');
                return (
                    <Tag color={isVIP ? 'gold' : isLoyal ? 'blue' : 'default'} className="rounded-none border-none text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 m-0">
                        {isVIP ? <StarFilled className="mr-1" /> : null}
                        {record.segment || 'GUEST'}
                    </Tag>
                );
            },
        },
        {
            title: 'Anonymized Engagement',
            key: 'engagement',
            render: (_: any, record: any) => (
                <div
                    className="space-y-1 cursor-pointer hover:bg-amber-50/50 transition-colors p-1 -m-1 rounded"
                    onClick={() => handleViewOrders(record.email)}
                >
                    <Space size={4} className="text-[10px] font-bold text-gray-400">
                        <ShoppingOutlined className="text-gray-300" /> {record.orderCount} Orders
                    </Space>
                    <br />
                    <Text className="text-xs font-serif text-amber-600 font-medium">
                        {formatVND(record.ltv)}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Last Purchase',
            key: 'lastOrder',
            render: (_: any, record: any) => (
                <Text className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {record.lastOrderAt ? new Date(record.lastOrderAt).toLocaleDateString('vi-VN') : '—'}
                </Text>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Text className="text-[11px] uppercase tracking-widest text-gray-400 font-bold border-l-2 border-amber-400 pl-3">
                    Aggregated Anonymous Traffic Intelligence
                </Text>
            </div>

            <Table
                columns={columns}
                dataSource={guests?.items || []}
                loading={isLoading}
                rowKey="email"
                pagination={{
                    current: page,
                    pageSize: 15,
                    total: guests?.meta?.total || 0,
                    onChange: setPage,
                    showSizeChanger: false,
                    position: ['bottomCenter'],
                }}
                className="luxury-table"
            />

            <GuestOrdersModal
                email={selectedEmail}
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

// ============================================
// TAB 3: LIFECYCLE INTELLIGENCE
// ============================================
const LifecycleTab: React.FC = () => {
    return (
        <div className="space-y-8">
            <Row gutter={16}>
                <Col span={6}>
                    <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
                        <Statistic
                            title={<Text className="text-[10px] uppercase tracking-widest font-bold">Total Clients</Text>}
                            value={1284}
                            prefix={<TeamOutlined className="text-blue-500" />}
                        />
                        <div className="mt-2 flex items-center text-green-500 gap-1 text-[10px] font-bold">
                            <ArrowUpOutlined /> 12% vs last month
                        </div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
                        <Statistic
                            title={<Text className="text-[10px] uppercase tracking-widest font-bold">VIP Share</Text>}
                            value={18.4}
                            suffix="%"
                            prefix={<CrownOutlined className="text-amber-500" />}
                        />
                        <Progress percent={18.4} size="small" strokeColor="#d4af37" showInfo={false} className="mt-2" />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
                        <Statistic
                            title={<Text className="text-[10px] uppercase tracking-widest font-bold">Churn Risk</Text>}
                            value={4.2}
                            suffix="%"
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<WarningOutlined className="text-red-500" />}
                        />
                        <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Target: Below 5%</div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card className="shadow-none border-gray-100 rounded-none bg-gray-50/50">
                        <Statistic
                            title={<Text className="text-[10px] uppercase tracking-widest font-bold">Avg. NPS Score</Text>}
                            value={8.9}
                            prefix={<HeartOutlined className="text-pink-500" />}
                        />
                        <div className="mt-2 flex items-center text-blue-500 gap-1 text-[10px] font-bold uppercase tracking-widest">Premium Satisfied</div>
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left" className="!text-xs !uppercase !tracking-widest !text-gray-400 font-bold">RFM Segmentation Map</Divider>

            <Row gutter={24}>
                <Col span={12}>
                    <Card title={<span className="text-[10px] uppercase tracking-widest font-bold">Top Value Clients (Champions)</span>} size="small" className="shadow-sm rounded-none">
                        <Table
                            size="small"
                            pagination={false}
                            dataSource={[
                                { name: 'Thanh Hoang', spend: 852000000, orders: 12, last: '2 days ago' },
                                { name: 'Minh Tu', spend: 421000000, orders: 5, last: '5 days ago' },
                                { name: 'Ngoc Anh', spend: 312000000, orders: 8, last: '1 day ago' },
                            ]}
                            columns={[
                                { title: 'Name', dataIndex: 'name', render: (v) => <Text className="font-serif text-xs">{v}</Text> },
                                { title: 'LTV', dataIndex: 'spend', render: (v) => <Text className="text-xs font-bold text-amber-600">{Number(v).toLocaleString()} đ</Text> },
                                { title: 'Last Touch', dataIndex: 'last', render: (v) => <Text className="text-[10px] uppercase text-gray-400">{v}</Text> },
                            ]}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title={<span className="text-[10px] uppercase tracking-widest font-bold">Dormant High Value (Churn Warning)</span>} size="small" className="shadow-sm rounded-none">
                        <Table
                            size="small"
                            pagination={false}
                            dataSource={[
                                { name: 'Linh Dang', spend: 125000000, dormant: '180 days', risk: 'High' },
                                { name: 'Khanh Le', spend: 95000000, dormant: '90 days', risk: 'Medium' },
                            ]}
                            columns={[
                                { title: 'Name', dataIndex: 'name', render: (v) => <Text className="font-serif text-xs">{v}</Text> },
                                { title: 'Dormancy', dataIndex: 'dormant', render: (v) => <Text className="text-xs text-red-400 font-bold">{v}</Text> },
                                { title: 'Risk', dataIndex: 'risk', render: (v) => <Badge status={v === 'High' ? 'error' : 'warning'} text={<Text className="text-[9px] uppercase font-bold">{v}</Text>} /> },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// ============================================
// MAIN CRM PAGE
// ============================================
export const CRMPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                <div className="space-y-1">
                    <Text className="tracking-widest uppercase text-[10px] text-gray-400 font-bold block">
                        Customer Intelligence & Clienteling
                    </Text>
                    <Title level={1} className="!mb-0 font-light text-5xl">Private Network</Title>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                defaultActiveKey="directory"
                className="luxury-tabs"
                items={[
                    {
                        key: 'directory',
                        label: (
                            <Space size={6}>
                                <TeamOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Client Directory</span>
                            </Space>
                        ),
                        children: <ClientDirectoryTab />,
                    },
                    {
                        key: 'guests',
                        label: (
                            <Space size={6}>
                                <GlobalOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Guest Registry</span>
                            </Space>
                        ),
                        children: <GuestRegistryTab />,
                    },
                    {
                        key: 'lifecycle',
                        label: (
                            <Space size={6}>
                                <RiseOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Intelligence & RFM</span>
                            </Space>
                        ),
                        children: <LifecycleTab />,
                    },
                    {
                        key: 'feedback',
                        label: (
                            <Space size={6}>
                                <StarFilled className="text-gray-400" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Feedback Hub</span>
                            </Space>
                        ),
                        children: <div className="py-20 text-center uppercase tracking-widest text-gray-300 font-bold text-xs">Moderation Module Coming Soon</div>,
                    },
                    {
                        key: 'settings',
                        label: (
                            <Space size={6}>
                                <GlobalOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">CRM Settings</span>
                            </Space>
                        ),
                        children: <div className="py-20 text-center uppercase tracking-widest text-gray-300 font-bold text-xs">Global CRM Policy Configuration</div>,
                    },
                ]}
            />
        </div>
    );
};

export default CRMPage;
