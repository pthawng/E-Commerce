import React from 'react';
import { Row, Col, Typography, Space, Button, Table, Avatar, Tag, Card, Badge, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/shared/api/customerApi';
import {
    PlusOutlined,
    SearchOutlined,
    MailOutlined,
    PhoneOutlined,
    StarOutlined,
    HistoryOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export const ConciergePage: React.FC = () => {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['concierge-stats'],
        queryFn: customerApi.getStats,
    });

    const { data: customerData, isLoading: customersLoading } = useQuery({
        queryKey: ['concierge-customers'],
        queryFn: () => customerApi.getCustomers({ limit: 10 }),
    });

    const customers = customerData?.items || [];

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const getTier = (ltv: number) => {
        if (ltv > 100000) return { label: 'Jade', color: 'bg-green-900 text-green-100' };
        if (ltv > 50000) return { label: 'Onyx', color: 'bg-black text-white' };
        if (ltv > 10000) return { label: 'Platinum', color: 'bg-slate-300 text-slate-800' };
        return { label: 'Classic', color: 'bg-gray-100 text-gray-500' };
    };

    return (
        <div className="space-y-12 pb-8 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-900 pb-8">
                <div className="space-y-1">
                    <Text className="tracking-luxury uppercase text-[10px] text-gray-400 font-bold block">Relationship Management</Text>
                    <Title level={1} className="!mb-0 font-light text-5xl">Concierge Desk</Title>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} className="h-12 px-8 bg-black dark:bg-[#d4af37] border-none uppercase tracking-widest text-[9px] font-bold">
                        Add New Patron
                    </Button>
                </Space>
            </div>

            {/* Strategic Insights */}
            <Row gutter={[48, 0]}>
                <Col span={8}>
                    <Card bordered={false} className="bg-[#fcfcfc] dark:bg-white/[0.02] p-2">
                        {statsLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                            <div className="flex items-center gap-4">
                                <Avatar size={48} className="bg-gray-100 text-gray-400" icon={<StarOutlined />} />
                                <div>
                                    <Text className="text-[10px] tracking-widest uppercase text-gray-400 block">Top Patron</Text>
                                    <Text className="text-lg font-serif">
                                        {stats?.topPatron?.name || 'Searching...'}
                                    </Text>
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="bg-[#fcfcfc] dark:bg-white/[0.02] p-2">
                        <div className="flex justify-between items-center h-full pt-2">
                            <div>
                                <Text className="text-[10px] tracking-widest uppercase text-gray-400 block inline-block mr-2">New Bespoke Inquiries</Text>
                                <Badge count={stats?.newInquiries || 0} style={{ backgroundColor: '#0e2258' }} />
                            </div>
                            <Button type="text" className="text-[9px] uppercase font-bold tracking-widest">Attend</Button>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="bg-[#fcfcfc] dark:bg-white/[0.02] p-2">
                        <div className="flex justify-between items-center h-full pt-2">
                            <div>
                                <Text className="text-[10px] tracking-widest uppercase text-gray-400 block">Average Customer LTV</Text>
                                <Text className="text-lg font-serif font-light">
                                    {formatCurrency(stats?.averageLtv || 0)}
                                </Text>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Patron Directory */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-serif">Patron Directory</h2>
                    <Button icon={<SearchOutlined />} type="text" className="text-gray-400 uppercase text-[9px] tracking-widest font-bold">Search Database</Button>
                </div>
                <Table
                    loading={customersLoading}
                    pagination={{ pageSize: 10 }}
                    dataSource={customers}
                    rowKey="id"
                    columns={[
                        {
                            title: 'Reference',
                            dataIndex: 'id',
                            key: 'id',
                            render: (t) => <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t.slice(0, 8)}</Text>
                        },
                        {
                            title: 'Patron',
                            dataIndex: 'fullName',
                            key: 'fullName',
                            render: (t) => (
                                <Space>
                                    <Avatar size="small" shape="square" className="bg-gray-100 text-[9px] font-bold text-gray-400">{t[0]}</Avatar>
                                    <Text className="text-xs font-serif font-medium">{t}</Text>
                                </Space>
                            )
                        },
                        {
                            title: 'Status',
                            dataIndex: 'ltv',
                            key: 'ltv_tier',
                            render: (v) => {
                                const tier = getTier(v || 0);
                                return (
                                    <Tag className={`rounded-none border-none px-3 text-[8px] uppercase tracking-widest font-bold ${tier.color}`}>
                                        {tier.label} Member
                                    </Tag>
                                );
                            }
                        },
                        {
                            title: 'Acquisition',
                            dataIndex: 'createdAt',
                            key: 'createdAt',
                            render: (t) => (
                                <Space size={4}>
                                    <EnvironmentOutlined className="text-[10px] text-gray-300" />
                                    <Text className="text-xs italic text-gray-400">{new Date(t).toLocaleDateString()}</Text>
                                </Space>
                            )
                        },
                        {
                            title: 'LTV (Equity)',
                            dataIndex: 'ltv',
                            key: 'ltv',
                            render: (v) => <Text className="text-xs font-serif font-bold text-[#0e2258] dark:text-[#d4af37]">{formatCurrency(v || 0)}</Text>
                        },
                        {
                            title: 'Interactions',
                            key: 'actions',
                            render: () => (
                                <Space size="middle">
                                    <MailOutlined className="text-gray-300 pointer" />
                                    <PhoneOutlined className="text-gray-300 pointer" />
                                    <HistoryOutlined className="text-gray-300 pointer" />
                                </Space>
                            )
                        }
                    ]}
                    className="luxury-table"
                />
            </div>
        </div>
    );
};

export default ConciergePage;
