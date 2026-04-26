import React, { useState, memo } from 'react';
import { Table, Tag, Space, Avatar, Typography } from 'antd';
import { GlobalOutlined, StarFilled, ShoppingOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customerApi, maskPII } from '@/shared/api/customerApi';
import { GuestOrdersModal } from './GuestOrdersModal';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';

const { Text } = Typography;

export const GuestRegistry: React.FC = memo(() => {
    const { t } = useTranslation();
    const { convertAndFormat } = useCurrencyConverter();
    const [page, setPage] = useState(1);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: guests, isLoading } = useQuery({
        queryKey: ['crm-guests', page],
        queryFn: () => customerApi.getGuests({ page, limit: 15 }),
    });

    const handleViewOrders = (email: string) => {
        setSelectedEmail(email);
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: t('crm.guests.table.guest'),
            key: 'identity',
            render: (_: any, record: any) => (
                <Space size={12}>
                    <Avatar icon={<GlobalOutlined />} className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500" />
                    <div>
                        <Text strong className="block text-sm font-serif">{maskPII(record.email, 'email')}</Text>
                        <Text className="text-[9px] text-gray-400 uppercase tracking-widest">{t('crm.guests.table.guest')}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: t('crm.directory.table.loyalty'),
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
            title: t('crm.directory.table.engagement'),
            key: 'engagement',
            render: (_: any, record: any) => (
                <div
                    className="space-y-1 cursor-pointer hover:bg-amber-50/50 transition-colors p-1 -m-1 rounded"
                    onClick={() => handleViewOrders(record.email)}
                >
                    <Space size={4} className="text-[10px] font-bold text-gray-400">
                        <ShoppingOutlined className="text-gray-300" /> {record.orderCount} {t('common.orders')}
                    </Space>
                    <br />
                    <Text className="text-xs font-serif text-amber-600 font-medium">
                        {convertAndFormat(record.ltv)}
                    </Text>
                </div>
            ),
        },
        {
            title: t('crm.guests.table.last_active'),
            key: 'lastOrder',
            render: (_: any, record: any) => (
                <Text className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {record.lastOrderAt ? new Date(record.lastOrderAt).toLocaleDateString() : '—'}
                </Text>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Text className="text-[11px] uppercase tracking-widest text-gray-400 font-bold border-l-2 border-amber-400 pl-3">
                    {t('crm.guests.title')}
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
});
