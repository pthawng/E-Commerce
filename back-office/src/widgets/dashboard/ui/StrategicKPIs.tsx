import React from 'react';
import { Row, Col, Statistic, Typography, Skeleton } from 'antd';
import { GoldOutlined, RiseOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/entities/dashboard/api/dashboardApi';
import { useTranslation } from 'react-i18next';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';

const { Text } = Typography;

export const StrategicKPIs: React.FC = () => {
    const { t } = useTranslation();
    const { convert, format } = useCurrencyConverter();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardApi.getStats,
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <Row gutter={[48, 48]} className="px-2">
                {[1, 2, 3, 4].map(i => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </Col>
                ))}
            </Row>
        );
    }

    return (
        <Row gutter={[48, 48]} className="px-2">
            <Col xs={24} sm={12} lg={6}>
                <div className="space-y-4">
                    <Text className="text-[11px] font-bold tracking-[0.2em] text-gray-900 dark:text-gray-100 uppercase block">
                        {t('dashboard.vault_liquidity')}
                    </Text>
                    <Statistic
                        value={convert(stats?.revenue || 0)}
                        formatter={(val: any) => format(Number(val))}
                        valueStyle={{
                            fontSize: '38px',
                            letterSpacing: '-0.04em',
                            fontWeight: 300,
                            fontFamily: 'Playfair Display, serif',
                        }}
                    />
                    <div className="flex items-center gap-2 text-[#b45309] text-[10px] tracking-tight uppercase font-black">
                        <GoldOutlined /> {t('dashboard.ledger_active')}
                    </div>
                </div>
            </Col>

            <Col xs={24} sm={12} lg={6} className="border-l border-gray-100 dark:border-gray-900 pl-12">
                <div className="space-y-4">
                    <Text className="text-[11px] font-bold tracking-[0.2em] text-gray-900 dark:text-gray-100 uppercase block">
                        {t('dashboard.atelier_load')}
                    </Text>
                    <Statistic
                        value={stats?.activeOrders || 0}
                        suffix={
                            <span className="text-lg ml-1 font-serif text-gray-400">
                                {t('dashboard.active_work_orders')}
                            </span>
                        }
                        valueStyle={{ fontSize: '38px', fontWeight: 300, fontFamily: 'Playfair Display, serif' }}
                    />
                    <div className="flex items-center gap-2 text-[#0e2258] dark:text-[#d4af37] text-[10px] tracking-tight uppercase font-black">
                        <DeploymentUnitOutlined /> {t('dashboard.craftsmanship')}
                    </div>
                </div>
            </Col>

            <Col xs={24} sm={12} lg={6} className="border-l border-gray-100 dark:border-gray-900 pl-12">
                <div className="space-y-4">
                    <Text className="text-[11px] font-bold tracking-[0.2em] text-gray-900 dark:text-gray-100 uppercase block">
                        {t('dashboard.pipeline_alerts')}
                    </Text>
                    <Statistic
                        value={stats?.lowStockItems || 0}
                        suffix={
                            <span className="text-lg ml-1 font-serif text-gray-400">
                                {t('dashboard.issues')}
                            </span>
                        }
                        valueStyle={{ fontSize: '38px', fontWeight: 300, fontFamily: 'Playfair Display, serif' }}
                    />
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-[10px] tracking-tight uppercase font-black">
                        <RiseOutlined /> {t('dashboard.criticality')}
                    </div>
                </div>
            </Col>

            <Col xs={24} sm={12} lg={6} className="border-l border-gray-100 dark:border-gray-900 pl-12">
                <div className="space-y-4">
                    <Text className="text-[11px] font-bold tracking-[0.2em] text-gray-900 dark:text-gray-100 uppercase block">
                        {t('dashboard.performance')}
                    </Text>
                    <Statistic
                        value={stats?.conversionRate || 0}
                        suffix={<span className="text-xl font-serif text-gray-500">% CR</span>}
                        valueStyle={{ fontSize: '38px', fontWeight: 300, fontFamily: 'Playfair Display, serif' }}
                    />
                    <Text className="text-[10px] font-black tracking-tight uppercase text-gray-500 block">
                        {t('dashboard.system_conversion')}
                    </Text>
                </div>
            </Col>
        </Row>
    );
};
