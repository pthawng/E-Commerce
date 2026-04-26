import React from 'react';
import { Tabs, Row, Col, Card, Statistic, Typography, Select, Space, Spin } from 'antd';
import { 
    BarChartOutlined, 
    UserOutlined, 
    ShopOutlined, 
    DashboardOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/shared/api/analyticsApi';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { WidgetErrorBoundary } from '@/shared/ui/ErrorBoundary/WidgetErrorBoundary';

const { Text, Title } = Typography;

export const AnalyticsPage: React.FC = () => {
    const { t } = useTranslation();
    const [range, setRange] = React.useState('30d');

    usePageHeader({
        title: t('analytics.title'),
        subtitle: t('analytics.subtitle'),
    });

    const { data: overview, isLoading: loadingOverview } = useQuery({
        queryKey: ['analytics-overview', range],
        queryFn: () => analyticsApi.getOverview(range),
    });

    const { data: customers } = useQuery({
        queryKey: ['analytics-customers'],
        queryFn: analyticsApi.getCustomerIntelligence,
    });

    const { data: products } = useQuery({
        queryKey: ['analytics-products'],
        queryFn: () => analyticsApi.getProductPerformance(),
    });

    const { data: operations } = useQuery({
        queryKey: ['analytics-operations'],
        queryFn: analyticsApi.getOperationsPulse,
    });

    const COLORS = ['#d4af37', '#0e2258', '#b45309', '#7c2d12', '#451a03', '#1e1b4b'];

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="flex justify-end mb-4">
                <Select value={range} onChange={setRange} className="w-40 luxury-select">
                    <Select.Option value="7d">{t('dashboard.under_24h')} (7d)</Select.Option>
                    <Select.Option value="30d">30 {t('orders.stats.days_mean')}</Select.Option>
                    <Select.Option value="90d">90 {t('orders.stats.days_mean')}</Select.Option>
                </Select>
            </div>
            
            <Row gutter={[24, 24]}>
                {overview?.metrics.map((m, idx) => {
                    const metricKey = m.label.toLowerCase().includes('revenue') ? 'revenue' : 
                                     m.label.toLowerCase().includes('profit') ? 'profit' :
                                     m.label.toLowerCase().includes('average') ? 'aov' : 'volume';
                    return (
                        <Col xs={24} sm={12} lg={6} key={idx}>
                            <Card className="luxury-card border-none shadow-sm hover:shadow-md transition-all">
                                <Statistic
                                    title={<Text className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{t(`analytics.metrics.${metricKey}`)}</Text>}
                                    value={m.value}
                                    precision={metricKey === 'volume' ? 0 : 2}
                                    prefix={m.prefix}
                                    valueStyle={{ fontSize: '28px', fontFamily: 'Playfair Display, serif', fontWeight: 300 }}
                                />
                            <div className="mt-2">
                                <Text type={m.delta >= 0 ? 'success' : 'danger'} className="text-[11px] font-bold">
                                    {m.delta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(m.delta).toFixed(1)}% 
                                </Text>
                                <Text className="text-[10px] text-gray-400 ml-1 uppercase tracking-tighter">vs previous</Text>
                            </div>
                        </Card>
                        </Col>
                    );
                })}
            </Row>

            <Card className="luxury-card border-none mt-6 overflow-hidden" title={<span className="text-[11px] uppercase font-bold tracking-[0.2em]">{t('analytics.metrics.revenue')} Flow</span>}>
                <div className="h-[350px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overview?.revenueChart}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#999' }}
                                tickFormatter={(str) => str.split('-').slice(1).join('/')}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );

    const renderCustomers = () => (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
                <Card className="luxury-card h-full" title={<span className="text-[11px] uppercase font-bold tracking-[0.2em]">{t('analytics.customers.segmentation')}</span>}>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={customers?.segmentDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="type"
                                >
                                    {customers?.segmentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </Col>
            <Col xs={24} lg={12}>
                <Card className="luxury-card h-full" title={<span className="text-[11px] uppercase font-bold tracking-[0.2em]">{t('analytics.customers.clv')} by Segment</span>}>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={customers?.clvMatrix} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis dataKey="segment" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="avgClv" fill="#0e2258" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </Col>
        </Row>
    );

    const renderProducts = () => (
        <Card className="luxury-card" title={<span className="text-[11px] uppercase font-bold tracking-[0.2em]">{t('analytics.products.margin_analysis')} matrix</span>}>
            <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="volume" name="Volume" unit=" units" axisLine={false} tickLine={false} label={{ value: 'Sales Volume', position: 'bottom', offset: 0, fontSize: 10 }} />
                        <YAxis type="number" dataKey="margin" name="Margin" unit="%" axisLine={false} tickLine={false} label={{ value: 'Profit Margin', angle: -90, position: 'left', fontSize: 10 }} />
                        <ZAxis type="number" dataKey="revenue" range={[100, 1000]} name="Revenue" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Products" data={products} fill="#d4af37">
                            {products?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                <Text className="text-[10px] text-gray-500 uppercase italic">
                    <BarChartOutlined className="mr-1" /> {t('analytics.products.margin_help')}
                </Text>
            </div>
        </Card>
    );

    const renderOperations = () => (
        <Card className="luxury-card" title={<span className="text-[11px] uppercase font-bold tracking-[0.2em]">{t('analytics.operations.cycle_time')} Breakdown</span>}>
            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operations}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="step" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10 }} 
                            tickFormatter={(val) => {
                                const stepKey = val.toLowerCase().replace(/ /g, '_');
                                return t(`dashboard.status_mapping.${val.toUpperCase()}`, { defaultValue: val });
                            }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} label={{ value: t('analytics.operations.avg_hours'), angle: -90, position: 'left', style: { fontSize: 10, fill: '#999' } }} />
                        <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)} h`, t('analytics.operations.avg_hours')]}
                            labelFormatter={(label) => t(`dashboard.status_mapping.${label.toUpperCase()}`, { defaultValue: label })}
                        />
                        <Bar dataKey="avgHours" fill="#b45309" radius={[4, 4, 0, 0]} barSize={40}>
                            {operations?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.avgHours > 48 ? '#7c2d12' : '#b45309'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );

    const items = [
        {
            key: 'overview',
            label: (
                <Space size={6}>
                    <DashboardOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('analytics.tabs.overview')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    {loadingOverview ? <div className="p-20 text-center"><Spin /></div> : renderOverview()}
                </WidgetErrorBoundary>
            ),
        },
        {
            key: 'customers',
            label: (
                <Space size={6}>
                    <UserOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('analytics.tabs.customers')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    {renderCustomers()}
                </WidgetErrorBoundary>
            ),
        },
        {
            key: 'products',
            label: (
                <Space size={6}>
                    <ShopOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('analytics.tabs.products')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    {renderProducts()}
                </WidgetErrorBoundary>
            ),
        },
        {
            key: 'operations',
            label: (
                <Space size={6}>
                    <BarChartOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('analytics.tabs.operations')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    {renderOperations()}
                </WidgetErrorBoundary>
            ),
        },
    ];

    return (
        <div className="pb-8 animate-in fade-in duration-1000">
            <Tabs
                defaultActiveKey="overview"
                className="luxury-tabs"
                items={items}
                destroyInactiveTabPane
            />
        </div>
    );
};

export default AnalyticsPage;
