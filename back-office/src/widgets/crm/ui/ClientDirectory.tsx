import React, { useState, memo } from 'react';
import { Table, Tag, Space, Button, Input, Avatar, Typography, Tooltip, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, ShoppingOutlined, TrophyOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customerApi, CustomerListItem, maskPII } from '@/shared/api/customerApi';
import { CustomerProfileDrawer } from '@/shared/ui/CustomerProfileDrawer';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';

const { Text } = Typography;

export const ClientDirectory: React.FC = memo(() => {
    const { t } = useTranslation();
    const { convertAndFormat } = useCurrencyConverter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { data: customers, isLoading } = useQuery({
        queryKey: ['crm-customers', page, search],
        queryFn: () => customerApi.getCustomers({ page, limit: 15, search: search || undefined }),
    });

    const handleView = (id: string) => {
        setSelectedCustomerId(id);
        setDrawerOpen(true);
    };

    const columns = [
        {
            title: t('crm.directory.table.patron'),
            key: 'client',
            render: (_: any, record: CustomerListItem) => (
                <Space
                    size={12}
                    className="cursor-pointer hover:bg-gray-50/50 transition-colors p-1 -m-1 rounded"
                    onClick={() => handleView(record.id)}
                >
                    <Avatar src={record.avatarUrl} icon={<UserOutlined />} className="bg-gray-100" />
                    <div>
                        <Text strong className="block text-sm font-serif">{record.fullName || t('dashboard.patron_default')}</Text>
                        <Text className="text-[10px] text-gray-400 uppercase tracking-widest">
                            {record.email ? maskPII(record.email, 'email') : t('crm.directory.table.privacy')}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: t('crm.directory.table.loyalty'),
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
                        {isVIP ? t('crm.intelligence.high_net_worth') : segment}
                    </Tag>
                );
            },
        },
        {
            title: t('crm.directory.table.engagement'),
            key: 'engagement',
            render: (_: any, record: CustomerListItem) => {
                const orderCount = record.orderCount ?? 0;
                const ltv = record.ltv ?? 0;

                return (
                    <div className="space-y-1">
                        <Tooltip title="Lifetime Orders">
                            <Space size={4} className="text-[10px] font-bold text-gray-400">
                                <ShoppingOutlined className="text-gray-300" /> {orderCount} {t('common.orders')}
                            </Space>
                        </Tooltip>
                        <br />
                        <Tooltip title="Lifetime Valuation">
                            <Text className="text-xs font-serif text-amber-600 font-medium">
                                {convertAndFormat(ltv)}
                            </Text>
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            title: t('common.status'),
            key: 'status',
            render: (_: any, record: CustomerListItem) => (
                <Space size={4}>
                    <Badge dot={record.isActive} status={record.isActive ? 'success' : 'default'} />
                    <Text className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
                        {record.isActive ? t('inventory.status.active') : t('crm.intelligence.dormant')}
                    </Text>
                </Space>
            ),
        },
        {
            title: t('crm.guests.table.last_active'),
            key: 'lastOrder',
            render: (_: any, record: CustomerListItem) => (
                <Text className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleDateString() : '—'}
                </Text>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Input
                    prefix={<SearchOutlined className="text-gray-300" />}
                    placeholder={t('crm.directory.search')}
                    className="h-10 w-80 border-gray-100 bg-transparent rounded-none text-xs"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    allowClear
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 px-6 bg-black border-none uppercase tracking-widest text-[9px] font-bold"
                >
                    {t('crm.directory.new_client')}
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
});
