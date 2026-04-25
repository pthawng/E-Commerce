import React, { useState } from 'react';
import {
    Drawer, Typography, Descriptions, Badge, Space, Tag, Table, Divider,
    Button, Statistic, Row, Col, Avatar, Card, Timeline, Tooltip, message,
    Empty, Spin, Alert, List, Progress
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined, ShoppingOutlined,
    StarOutlined, HistoryOutlined, EyeOutlined, EyeInvisibleOutlined,
    SafetyCertificateOutlined, CrownOutlined, RiseOutlined, FireOutlined,
    ClockCircleOutlined, CheckCircleOutlined, DollarCircleOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { customerApi, CustomerDetail, maskPII } from '../api/customerApi';

const { Title, Text, Paragraph } = Typography;

interface CustomerProfileDrawerProps {
    customerId: string | null;
    open: boolean;
    onClose: () => void;
}

const formatVND = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0 ₫';
    return Number(value).toLocaleString('vi-VN') + ' ₫';
};

export const CustomerProfileDrawer: React.FC<CustomerProfileDrawerProps> = ({ customerId, open, onClose }) => {
    const [piiVisible, setPiiVisible] = useState(false);

    const { data: customer, isLoading, error } = useQuery({
        queryKey: ['customer-detail', customerId],
        queryFn: () => customerId ? customerApi.getCustomerDetail(customerId) : null,
        enabled: !!customerId && open,
    });

    const handleRevealPII = () => {
        if (!customer) return;
        setPiiVisible(true);
        customerApi.logPiiAccess(customer.id, 'Manual reveal for clienteling check');
        message.info('PII access has been logged for audit compliance');
    };

    if (!customerId) return null;

    // Derived Intelligence
    const totalSpend = customer?.orders?.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0) || 0;
    const orderCount = customer?.orders?.length || 0;
    const aov = orderCount > 0 ? totalSpend / orderCount : 0;

    const isVIP = totalSpend > 100000000; // 100M VND
    const segment = isVIP ? 'VIP High Roller' : (orderCount > 3 ? 'Loyal Client' : 'New Prospect');

    return (
        <Drawer
            title={
                <Space>
                    <UserOutlined />
                    <span className="font-serif">Customer Intelligence Profile</span>
                </Space>
            }
            width={850}
            onClose={() => { onClose(); setPiiVisible(false); }}
            open={open}
            className="luxury-drawer"
        >
            {isLoading ? (
                <div className="h-full flex items-center justify-center"><Spin size="large" /></div>
            ) : error ? (
                <Alert type="error" message="Failed to load customer profile" showIcon />
            ) : customer ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                    {/* Header: Identity & Segment */}
                    <div className="flex justify-between items-start">
                        <Space size={20} align="start">
                            <Avatar size={80} src={customer.avatarUrl} icon={<UserOutlined />} className="border-2 border-gold-200 shadow-sm" />
                            <div>
                                <Title level={3} className="!mb-1 font-serif">{customer.fullName || 'Anonymous Client'}</Title>
                                <Space size={8} wrap>
                                    <Tag color={isVIP ? 'gold' : 'blue'} className="text-[10px] uppercase font-bold tracking-widest border-none px-3 py-0.5">
                                        {isVIP ? <CrownOutlined className="mr-1" /> : null}
                                        {segment}
                                    </Tag>
                                    <Tag className="text-[10px] uppercase tracking-widest m-0 px-2">Member since {new Date(customer.createdAt).getFullYear()}</Tag>
                                    <Badge status={customer.isActive ? 'success' : 'default'} text={<Text className="text-[10px] uppercase text-gray-400 font-bold">Account {customer.isActive ? 'Active' : 'Disabled'}</Text>} />
                                </Space>
                            </div>
                        </Space>
                        <div className="text-right">
                            <Text className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Lifetime Value</Text>
                            <Title level={2} className="!mb-0 !mt-0 font-light text-amber-600">{formatVND(totalSpend)}</Title>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <Row gutter={16}>
                        <Col span={8}>
                            <Card className="bg-gray-50 border-none shadow-none text-center rounded-none overflow-hidden hover:bg-white hover:shadow-sm transition-all cursor-default">
                                <Statistic title={<Text className="text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400">Total Orders</Text>} value={orderCount} prefix={<ShoppingOutlined className="text-blue-500" />} />
                                <div className="mt-2 text-[10px] text-gray-400 uppercase font-bold">Frequency: {orderCount > 5 ? 'High' : 'Moderate'}</div>
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card className="bg-gray-50 border-none shadow-none text-center rounded-none overflow-hidden hover:bg-white hover:shadow-sm transition-all cursor-default">
                                <Statistic title={<Text className="text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400">Avg. Basket</Text>} value={aov} formatter={(v) => formatVND(Number(v))} prefix={<RiseOutlined className="text-green-500" />} />
                                <div className="mt-2 text-[10px] text-gray-400 uppercase font-bold">Tier: Premium</div>
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card className="bg-gray-50 border-none shadow-none text-center rounded-none overflow-hidden hover:bg-white hover:shadow-sm transition-all cursor-default">
                                <Statistic title={<Text className="text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400">Affinity Score</Text>} value={85} suffix="%" prefix={<FireOutlined className="text-orange-500" />} />
                                <div className="mt-2 text-[10px] text-gray-400 uppercase font-bold">Style: Engagement Focus</div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Contact & Privacy Panel */}
                    <Card title={
                        <Space className="w-full justify-between">
                            <Space><SafetyCertificateOutlined className="text-blue-500" /><span className="text-xs uppercase tracking-widest font-bold">Secure Contact Information</span></Space>
                            <Button
                                size="small"
                                type={piiVisible ? 'text' : 'primary'}
                                icon={piiVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                onClick={piiVisible ? () => setPiiVisible(false) : handleRevealPII}
                                className={piiVisible ? 'text-gray-400' : 'bg-black border-none text-[10px] font-bold uppercase px-3'}
                            >
                                {piiVisible ? 'Mask Data' : 'Reveal PII'}
                            </Button>
                        </Space>
                    } className="shadow-sm border-gray-100 rounded-none">
                        <Descriptions column={2} size="small" layout="horizontal">
                            <Descriptions.Item label={<Space><MailOutlined className="text-gray-400" /> <Text className="text-[10px] uppercase font-bold text-gray-400">Email</Text></Space>}>
                                <Text copyable={piiVisible} className="font-mono text-xs">
                                    {piiVisible ? customer.email : maskPII(customer.email, 'email')}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><PhoneOutlined className="text-gray-400" /> <Text className="text-[10px] uppercase font-bold text-gray-400">Phone</Text></Space>}>
                                <Text copyable={piiVisible} className="font-mono text-xs">
                                    {piiVisible ? (customer.phone || 'N/A') : maskPII(customer.phone, 'phone')}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>
                        {!piiVisible && (
                            <div className="mt-4 p-2 bg-blue-50/50 flex items-start gap-2 rounded border border-blue-100/50">
                                <Tooltip title="FAANG-grade privacy compliance: Accessing PII is logged for audit trails.">
                                    <ClockCircleOutlined className="text-blue-400 mt-1" />
                                </Tooltip>
                                <Text className="text-[10px] text-blue-500">
                                    This information is masked for data privacy. Revealing it will generate an audit entry linked to your account.
                                </Text>
                            </div>
                        )}
                    </Card>

                    {/* Luxury Intelligence: Preferences & Life Events */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Card title={<Space><StarOutlined className="text-amber-500" /><span className="text-[10px] uppercase tracking-widest font-bold">Luxury Preferences</span></Space>} className="shadow-sm border-gray-100 rounded-none h-full">
                                {customer.preferences && customer.preferences.length > 0 ? (
                                    <List
                                        size="small"
                                        dataSource={customer.preferences}
                                        renderItem={(p: any) => (
                                            <List.Item className="px-0 border-none pb-3">
                                                <div className="w-full">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <Text className="text-[10px] uppercase text-gray-400 font-bold">{p.category}</Text>
                                                        <Text className="text-[10px] text-amber-600 font-serif">{p.value}</Text>
                                                    </div>
                                                    <Progress
                                                        percent={p.intensity * 10}
                                                        size={[300, 3]}
                                                        showInfo={false}
                                                        strokeColor="#d4af37"
                                                        trailColor="#f5f5f5"
                                                    />
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text className="text-[10px] text-gray-400 uppercase tracking-widest">No preferences recorded</Text>} />
                                )}
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card title={<Space><FireOutlined className="text-orange-500" /><span className="text-[10px] uppercase tracking-widest font-bold">Key Life Events</span></Space>} className="shadow-sm border-gray-100 rounded-none h-full">
                                {customer.lifeEvents && customer.lifeEvents.length > 0 ? (
                                    <List
                                        size="small"
                                        dataSource={customer.lifeEvents}
                                        renderItem={(e: any) => (
                                            <List.Item className="px-0 border-b border-gray-50 last:border-none py-2">
                                                <Space size={12} align="start">
                                                    <div className="bg-amber-50 p-2 rounded">
                                                        <ClockCircleOutlined className="text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <Text strong className="text-xs uppercase tracking-tight block">{e.eventType}</Text>
                                                        <Text className="text-[10px] text-gray-400 font-bold">{new Date(e.eventDate).toLocaleDateString('vi-VN')}</Text>
                                                    </div>
                                                </Space>
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text className="text-[10px] text-gray-400 uppercase tracking-widest">No events mapped</Text>} />
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Unified Event Timeline */}
                    <div>
                        <Divider orientation="left" className="!text-xs !uppercase !tracking-widest !text-gray-400 font-bold mb-6">Clienteling Timeline</Divider>
                        <Timeline
                            mode="left"
                            items={[
                                ...customer.orders.map((o: any) => ({
                                    label: <Text className="text-[10px] text-gray-400 font-bold">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</Text>,
                                    children: (
                                        <Card size="small" className="border-l-4 border-l-blue-500 shadow-sm rounded-none hover:shadow-md transition-shadow cursor-pointer">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Text strong className="text-xs uppercase tracking-tight block">Order Placed #{o.orderNumber || o.id.slice(0, 8)}</Text>
                                                    <Text className="text-xs text-gray-500 font-light block mt-1">{o.items?.length || 1} pieces — Status: <Tag color="processing" className="border-none text-[8px]">{o.status}</Tag></Text>
                                                </div>
                                                <Text className="font-serif text-sm font-medium">{formatVND(o.totalAmount)}</Text>
                                            </div>
                                        </Card>
                                    ),
                                    color: 'blue'
                                })),
                                {
                                    label: <Text className="text-[10px] text-gray-400 font-bold">{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</Text>,
                                    children: (
                                        <div className="flex items-center gap-2">
                                            <CheckCircleOutlined className="text-green-500" />
                                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account Created at Ray Paradis</Text>
                                        </div>
                                    ),
                                    color: 'gray'
                                }
                            ].sort((a, b) => {
                                const dateA = new Date(a.label.props.children as string).getTime();
                                const dateB = new Date(b.label.props.children as string).getTime();
                                return dateB - dateA;
                            })}
                        />
                    </div>

                    {/* Service Journal (Notes) */}
                    <Card title={<Space><HistoryOutlined /> <span className="text-xs uppercase tracking-widest font-bold">Service Journal & Notes</span></Space>} className="shadow-sm border-gray-100 rounded-none bg-amber-50/20">
                        <Paragraph className="text-xs text-gray-600 font-light italic">
                            {customer.bio || "No personalized notes yet. Add preferences here e.g. 'Loves Rose Gold', 'Buying for 10th anniversary'."}
                        </Paragraph>
                        <Button type="dashed" block className="mt-2 text-[10px] font-bold uppercase tracking-widest border-gray-300 h-10 hover:border-black hover:text-black transition-colors">
                            Update Journal
                        </Button>
                    </Card>
                </div>
            ) : null}
        </Drawer>
    );
};
