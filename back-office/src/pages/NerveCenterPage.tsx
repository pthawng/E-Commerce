import React, { useState } from 'react';
import {
    Typography, Tabs, Table, Tag, Space, Button, Card, Row, Col, Statistic, Input,
    Badge, Modal, Form, Select, Switch, message, Tooltip, Empty, Spin, Avatar,
    Progress, Divider, List
} from 'antd';
import {
    DatabaseOutlined, MailOutlined, SyncOutlined, BugOutlined,
    CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
    EyeOutlined, PlayCircleOutlined, DeleteOutlined, SettingOutlined,
    SafetyCertificateOutlined, DotChartOutlined, DashboardOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';

const { Title, Text, Paragraph } = Typography;

// ============================================
// TAB 1: DOMAIN EVENTS (EVD)
// ============================================
const DomainEventsTab: React.FC = () => {
    const [page, setPage] = useState(1);

    // Mock data for UI demonstration - In production, use your API hook
    const { data: events, isLoading } = useQuery({
        queryKey: ['nerve-events', page],
        queryFn: async () => ({
            items: [
                { id: '1', eventType: 'order.created', status: 'COMPLETED', retryCount: 0, createdAt: new Date().toISOString(), payload: { orderId: 'ORD-123' } },
                { id: '2', eventType: 'payment.failed', status: 'FAILED', retryCount: 5, lastError: 'Gateway Timeout', createdAt: new Date().toISOString(), payload: { orderId: 'ORD-124' } },
                { id: '3', eventType: 'inventory.reserved', status: 'PENDING', retryCount: 0, createdAt: new Date().toISOString(), payload: { variantId: 'V-88' } },
            ],
            meta: { total: 3 }
        }),
    });

    const columns = [
        {
            title: 'Event Type',
            dataIndex: 'eventType',
            key: 'eventType',
            render: (v: string) => <Text className="font-mono text-[10px] bg-gray-50 px-2 py-1 border border-gray-100 uppercase tracking-widest">{v}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (v: string) => {
                const isFailed = v === 'FAILED';
                const isCompleted = v === 'COMPLETED';
                return (
                    <Tag color={isCompleted ? 'success' : isFailed ? 'error' : 'processing'} className="rounded-none border-none text-[9px] uppercase font-bold tracking-widest">
                        {v}
                    </Tag>
                );
            }
        },
        {
            title: 'Retries',
            dataIndex: 'retryCount',
            key: 'retryCount',
            render: (v: number) => <Text className="text-[10px] font-bold text-gray-400">{v} / 5</Text>
        },
        {
            title: 'Timestamp',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v: string) => <Text className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(v).toLocaleTimeString()}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space size={12}>
                    <Tooltip title="View Payload"><EyeOutlined className="text-gray-400 cursor-pointer hover:text-black" /></Tooltip>
                    {record.status === 'FAILED' && <Tooltip title="Manual Retry"><PlayCircleOutlined className="text-amber-500 cursor-pointer hover:text-amber-600" /></Tooltip>}
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Row gutter={16}>
                <Col span={6}>
                    <Card size="small" className="bg-gray-50/50 border-gray-100">
                        <Statistic
                            title={<Text className="text-[9px] uppercase tracking-widest font-bold">Event Backlog</Text>}
                            value={12}
                            prefix={<DatabaseOutlined className="text-blue-500" />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small" className="bg-gray-50/50 border-gray-100">
                        <Statistic
                            title={<Text className="text-[9px] uppercase tracking-widest font-bold">Failure Rate (24h)</Text>}
                            value={0.8}
                            suffix="%"
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<BugOutlined className="text-red-500" />}
                        />
                    </Card>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={events?.items || []}
                loading={isLoading}
                rowKey="id"
                pagination={false}
                className="luxury-table"
            />
        </div>
    );
};

// ============================================
// TAB 2: EMAIL OUTBOX
// ============================================
const EmailOutboxTab: React.FC = () => {
    return (
        <div className="py-10 text-center">
            <MailOutlined className="text-4xl text-gray-200 mb-4" />
            <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">Communication Queue Monitor Coming Soon</div>
        </div>
    );
};

// ============================================
// MAIN NERVE CENTER PAGE
// ============================================
export const NerveCenterPage: React.FC = () => {
    usePageHeader({
        title: 'Nerve Center',
        subtitle: 'System Observability & Operational Resilience',
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Health Pulse */}
            <Card className="shadow-sm border-gray-100 rounded-none bg-black text-white">
                <Row gutter={24} align="middle">
                    <Col span={4}>
                        <div className="flex flex-col items-center border-r border-gray-800">
                            <SafetyCertificateOutlined className="text-3xl text-emerald-500 mb-2" />
                            <Text className="text-emerald-500 uppercase text-[9px] font-bold tracking-widest">System Intact</Text>
                        </div>
                    </Col>
                    <Col span={20}>
                        <div className="flex justify-between items-center px-4">
                            <div>
                                <Title level={4} className="!text-white !mb-1 font-serif">Core Operations Matrix</Title>
                                <Text className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">FAANG-Grade L8 Monitoring</Text>
                            </div>
                            <Space size={24}>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Worker Status</div>
                                    <div className="text-emerald-400 font-bold text-xs uppercase">Healthy</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ledger Drift</div>
                                    <div className="text-white font-bold text-xs">0.00 VND</div>
                                </div>
                            </Space>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Tabs
                defaultActiveKey="events"
                className="luxury-tabs"
                items={[
                    {
                        key: 'events',
                        label: (
                            <Space size={6}>
                                <SyncOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Domain Events</span>
                            </Space>
                        ),
                        children: <DomainEventsTab />,
                    },
                    {
                        key: 'email',
                        label: (
                            <Space size={6}>
                                <MailOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Email Queue</span>
                            </Space>
                        ),
                        children: <EmailOutboxTab />,
                    },
                    {
                        key: 'logs',
                        label: (
                            <Space size={6}>
                                <ClockCircleOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Audit History</span>
                            </Space>
                        ),
                        children: <div className="py-20 text-center uppercase tracking-widest text-gray-300 font-bold text-xs">System Audit Logs (Streaming)</div>,
                    },
                ]}
            />
        </div>
    );
};

export default NerveCenterPage;
