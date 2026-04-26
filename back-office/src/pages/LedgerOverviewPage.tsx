import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Statistic, Table, Typography, Space, Button, Tabs, Card, Badge, Modal, message, Tag, Input } from 'antd';
import {
    SafetyCertificateOutlined,
    DollarCircleOutlined,
    SolutionOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { ledgerApi, LedgerBalance, LedgerKPIs, FinancialFlow } from '../shared/api/ledgerApi';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const LedgerOverviewPage: React.FC = () => {
    const navigate = useNavigate();
    const [kpis, setKpis] = useState<LedgerKPIs | null>(null);
    const [balances, setBalances] = useState<LedgerBalance[]>([]);
    const [flows, setFlows] = useState<FinancialFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('materials');
    const { convertAndFormat } = useCurrencyConverter();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [kpiRes, balanceRes, flowRes] = await Promise.all([
                ledgerApi.getKPIs(),
                ledgerApi.getBalances(),
                ledgerApi.getFlows(1, 10),
            ]);
            setKpis(kpiRes);
            setBalances(balanceRes);
            setFlows(flowRes.items);
        } catch (error) {
            message.error('Failed to fetch ledger data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    usePageHeader({
        title: 'The Ledger',
        subtitle: 'Unified Ledger Hub',
        isLoading: loading && !kpis
    });

    const handleReconcile = async (id: string, status: string) => {
        try {
            await ledgerApi.reconcile(id, status);
            message.success('Transaction reconciled successfully');
            fetchData(); // Refresh
        } catch (error) {
            message.error('Reconciliation failed');
        }
    };

    const materialColumns = [
        {
            title: 'Material Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: any) => (
                <Text className="font-serif font-bold">
                    {typeof name === 'string' ? name : (name?.vi || name?.en || 'N/A')}
                </Text>
            )
        },
        { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (s: string) => <Tag color="blue">{s}</Tag> },
        {
            title: 'Balance',
            dataIndex: 'available',
            key: 'available',
            render: (val: number) => <Text className="text-lg font-serif">{val.toLocaleString()}</Text>
        },
        {
            title: 'Value (Est.)',
            key: 'value',
            render: (r: LedgerBalance) => (
                <Text className="text-gray-500">
                    {convertAndFormat(r.available * r.costPrice)}
                </Text>
            )
        },
        { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse' },
    ];

    const flowColumns = [
        {
            title: 'Reference',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Text className="text-[10px] text-gray-400 font-mono uppercase">{id.slice(0, 8)}...</Text>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amt: number) => <Text className="font-serif font-bold">{convertAndFormat(amt)}</Text>
        },
        {
            title: 'Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (m: string) => <Tag>{m}</Tag>
        },
        {
            title: 'Recon Status',
            dataIndex: 'reconciliationStatus',
            key: 'reconciliationStatus',
            render: (status: string) => {
                const colors: any = { UNVERIFIED: 'orange', MATCHED: 'success', MISMATCH: 'error', RECONCILED: 'blue' };
                return <Badge status={colors[status] || 'default'} text={status} />;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (r: FinancialFlow) => (
                <Space>
                    {r.reconciliationStatus === 'UNVERIFIED' && (
                        <Button
                            size="small"
                            type="primary"
                            className="bg-green-600 border-none"
                            onClick={() => handleReconcile(r.id, 'MATCHED')}
                        >
                            Verify
                        </Button>
                    )}
                    <Button 
                        size="small" 
                        icon={<SolutionOutlined />}
                        onClick={() => {
                            const orderId = (r as any).orderId || (r as any).order?.id;
                            if (orderId) navigate(`/orders/${orderId}`);
                        }}
                    >
                        View Order
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div className="pb-8 animate-in fade-in duration-1000">
            {/* Action Bar - Consistent with CRM/PIM */}
            <div className="flex justify-between items-center mb-8">
                <Input 
                    prefix={<SearchOutlined className="text-gray-300" />} 
                    placeholder="Search transactions or assets..." 
                    className="h-10 w-80 border-gray-100 bg-transparent rounded-none text-[11px]"
                />
                <Button 
                    icon={<SyncOutlined />} 
                    onClick={fetchData} 
                    loading={loading}
                    className="h-10 px-6 bg-black text-white border-none uppercase tracking-widest text-[9px] font-bold"
                >
                    Refresh Intelligence
                </Button>
            </div>

            {/* Main Tabs */}
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                className="luxury-tabs"
                items={[
                    {
                        key: 'materials',
                        label: (
                            <Space size={6}>
                                <SafetyCertificateOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Material Integrity</span>
                            </Space>
                        ),
                        children: (
                            <div className="mt-4">
                                <Table
                                    loading={loading}
                                    columns={materialColumns}
                                    dataSource={balances}
                                    rowKey="id"
                                    className="luxury-table"
                                />
                            </div>
                        )
                    },
                    {
                        key: 'finance',
                        label: (
                            <Space size={6}>
                                <DollarCircleOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Financial Flows</span>
                            </Space>
                        ),
                        children: (
                            <div className="mt-4">
                                <Table
                                    loading={loading}
                                    columns={flowColumns}
                                    dataSource={flows}
                                    rowKey="id"
                                    className="luxury-table"
                                />
                            </div>
                        )
                    }
                ]}
            />

            {/* Legend / Advisory */}
            <Row gutter={48} className="mt-12 bg-gray-50/50 dark:bg-white/5 p-8 rounded-lg">
                <Col span={12}>
                    <Title level={5} className="font-serif !mb-4">Compliance Advisory</Title>
                    <Text className="text-xs text-gray-500 leading-relaxed block mb-4">
                        The Ledger tracks foundational material assets using physical stock audits and financial reconciliation records.
                        Any discrepancy in 'Material Equity' should trigger a physical audit within 24 hours.
                    </Text>
                    <Button icon={<SyncOutlined />} onClick={fetchData} className="uppercase tracking-widest text-[9px] font-bold">Refresh Real-time Streams</Button>
                </Col>
                <Col span={12} className="border-l border-gray-100 dark:border-gray-900 pl-12 flex items-center">
                    <div className="flex gap-8">
                        <div className="text-center">
                            <div className="text-2xl font-serif text-red-500">{kpis?.activeDiscrepancies || 0}</div>
                            <Text className="text-[10px] uppercase font-bold text-gray-400">Flagged Exceptions</Text>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-serif text-green-600">99.8%</div>
                            <Text className="text-[10px] uppercase font-bold text-gray-400">Audit Health</Text>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

const Divider = ({ type, className }: { type: 'vertical' | 'horizontal', className?: string }) => (
    <div className={`${type === 'vertical' ? 'w-[1px] h-full' : 'h-[1px] w-full'} bg-gray-100 dark:bg-gray-800 ${className}`} />
);

export default LedgerOverviewPage;
