import React from 'react';
import { Typography, Row, Col, Tag, Avatar, Space, Button, Badge, Breadcrumb } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    MoreOutlined,
    PlusOutlined,
    FilterOutlined,
    RiseOutlined,
    ClockCircleOutlined,
    AlertOutlined
} from '@ant-design/icons';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';

const { Title, Text } = Typography;

export const OrdersPage: React.FC = () => {
    const { t } = useTranslation();
    const { convertAndFormat } = useCurrencyConverter();

    const ORDER_COLUMNS = [
        { title: t('dashboard.status_mapping.CONFIRMED'), status: 'confirmed', count: 4, color: '#f0f0f0' },
        { title: t('dashboard.status_mapping.IN_PRODUCTION'), status: 'in_production', count: 8, color: '#e6f4ff' },
        { title: 'Quality Control', status: 'quality_control', count: 3, color: '#fff1f0' },
        { title: 'Ready for Vault', status: 'ready_vault', count: 2, color: '#f6ffed' },
    ];

    const MOCK_ORDERS = [
        { id: 'ORD-772', client: 'Helena Vance', item: 'Platinum Crown Ring', value: 315000000, stage: 'casting', priority: 'high', time: '12h ago' },
        { id: 'ORD-775', client: 'Julian Morne', item: 'White Gold Cufflinks', value: 81000000, stage: 'polishing', priority: 'normal', time: '5h ago' },
        { id: 'ORD-778', client: 'Sofia Rossi', item: 'Diamond Petal Studs', value: 215000000, stage: 'setting', priority: 'vip', time: '2h ago' },
    ];

    return (
        <div className="space-y-12 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Minimalist Header */}
            <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-900 pb-8">
                <div className="space-y-2">
                    <Breadcrumb
                        separator="·"
                        items={[{ title: t('orders.atelier') }, { title: t('orders.orchestrator') }]}
                        className="text-[9px] tracking-[0.3em] uppercase mb-4"
                    />
                    <Title level={1} className="!mb-0 font-light text-5xl">{t('orders.title')}</Title>
                </div>
                <Space size="middle">
                    <Button icon={<FilterOutlined />} className="h-12 px-6 uppercase tracking-widest text-[9px] font-bold">
                        {t('orders.filter_stage')}
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} className="h-12 px-8 bg-black dark:bg-[#d4af37] border-none uppercase tracking-widest text-[9px] font-bold">
                        {t('orders.create_bespoke')}
                    </Button>
                </Space>
            </div>

            {/* Pipeline Stats */}
            <Row gutter={[48, 0]} className="px-2">
                <Col span={6}>
                    <Text className="text-[10px] tracking-widest uppercase text-gray-400 block mb-2">{t('orders.stats.efficiency')}</Text>
                    <div className="flex items-center gap-3">
                        <Text className="text-3xl font-serif">4.2</Text>
                        <Text className="text-[10px] font-bold text-green-500 uppercase">{t('orders.stats.days_mean')}</Text>
                    </div>
                </Col>
                <Col span={6} className="border-l border-gray-100 dark:border-gray-900 pl-12">
                    <Text className="text-[10px] tracking-widest uppercase text-gray-400 block mb-2">{t('orders.stats.backlog_valuation')}</Text>
                    <div className="flex items-center gap-3">
                        <Text className="text-3xl font-serif font-light">$242k</Text>
                        <RiseOutlined className="text-green-500" />
                    </div>
                </Col>
                <Col span={6} className="border-l border-gray-100 dark:border-gray-900 pl-12">
                    <Text className="text-[10px] tracking-widest uppercase text-gray-400 block mb-2">{t('orders.stats.atelier_load')}</Text>
                    <div className="flex items-center gap-3">
                        <Text className="text-3xl font-serif">84%</Text>
                        <Badge status="processing" />
                    </div>
                </Col>
            </Row>

            {/* Kanban Surface */}
            <Row gutter={24} className="min-h-[600px]">
                {ORDER_COLUMNS.map((col) => (
                    <Col key={col.status} span={6} className="h-full">
                        <div className="space-y-6 h-full border-r border-gray-50 dark:border-gray-900 pr-4 last:border-none">
                            <div className="flex justify-between items-baseline px-2">
                                <Text className="tracking-[0.2em] uppercase text-[11px] font-bold text-gray-500">{col.title}</Text>
                                <Text className="text-[10px] italic text-gray-300">{t('orders.kanban.items_count', { count: col.count })}</Text>
                            </div>

                            <div className="space-y-4">
                                {MOCK_ORDERS.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-gray-900 p-6 space-y-5 hover:shadow-2l transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <Text className="text-[9px] font-bold tracking-widest text-[#0e2258] dark:text-[#d4af37] block uppercase">{order.id}</Text>
                                                <h3 className="text-xs font-serif font-medium">{order.client}</h3>
                                            </div>
                                            <Button type="text" size="small" icon={<MoreOutlined className="text-gray-300" />} />
                                        </div>

                                        <div className="space-y-3">
                                            <Text className="text-[10px] text-gray-400 italic block">{order.item}</Text>
                                            <div className="flex justify-between items-end">
                                                <Text className="text-sm font-serif font-light">{convertAndFormat(order.value)}</Text>
                                                <Space size={4}>
                                                    {order.priority === 'vip' && <AlertOutlined className="text-orange-400 text-[10px]" />}
                                                    <Tag className="rounded-none text-[8px] uppercase font-bold px-1.5 border-gray-100 dark:border-gray-800 m-0">
                                                        {order.stage}
                                                    </Tag>
                                                </Space>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-50 dark:border-gray-900 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Space size="small">
                                                <Avatar size={16} className="bg-gray-100 text-[8px] text-gray-500 font-bold">MC</Avatar>
                                                <Text className="text-[9px] uppercase tracking-tighter">{t('orders.kanban.atelier_lead')}</Text>
                                            </Space>
                                            <Space size={4} className="text-[9px] text-gray-400">
                                                <ClockCircleOutlined className="text-[8px]" />
                                                <span>{order.time}</span>
                                            </Space>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    block
                                    className="border-dashed border-gray-200 dark:border-gray-800 h-16 text-gray-300 hover:text-black uppercase tracking-widest text-[9px] font-bold"
                                    icon={<PlusOutlined />}
                                >
                                    {t('orders.kanban.draft_interaction')}
                                </Button>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default OrdersPage;
