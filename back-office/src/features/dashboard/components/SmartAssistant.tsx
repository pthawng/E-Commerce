import React from 'react';
import { List, Button, Badge, Typography, Space } from 'antd';
import { 
    RobotOutlined, 
    BellOutlined, 
    ArrowRightOutlined,
    WarningOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { GlassCard } from '@/shared/ui/GlassCard';
import { useDashboardStats } from '@/entities/dashboard/model/queries';
import { useOrders } from '@/entities/order/model/queries';

const { Text } = Typography;

export const SmartAssistant: React.FC = () => {
    const { data: stats } = useDashboardStats();
    const { data: orders } = useOrders({ page: 1, limit: 10, status: 'pending' });

    // Generate smart insights
    const insights = [];

    const pendingOrdersCount = orders?.meta?.total ?? 0;
    if (pendingOrdersCount > 0) {
        insights.push({
            status: 'warning',
            icon: <BellOutlined style={{ color: '#faad14' }} />,
            text: `Bạn có ${pendingOrdersCount} đơn hàng đang chờ xử lý.`,
            action: 'Xử lý ngay',
        });
    }

    const lowStockCount = stats?.lowStockItems ?? 0;
    if (lowStockCount > 0) {
        insights.push({
            status: 'error',
            icon: <WarningOutlined style={{ color: '#cf1322' }} />,
            text: `${lowStockCount} sản phẩm sắp hết hàng trong kho.`,
            action: 'Nhập hàng',
        });
    }

    const conversionRate = stats?.conversionRate ?? 0;
    if (conversionRate > 3) {
        insights.push({
            status: 'success',
            icon: <CheckCircleOutlined style={{ color: '#3f8600' }} />,
            text: `Tỷ lệ chuyển đổi hôm nay đạt ${conversionRate}%, rất ấn tượng!`,
            action: 'Xem chi tiết',
        });
    }

    return (
        <GlassCard 
            title={
                <Space>
                    <RobotOutlined style={{ color: '#1890ff' }} />
                    <span>AI Smart Assistant</span>
                </Space>
            }
            bordered={false}
            style={{ height: '100%' }}
        >
            <List
                itemLayout="horizontal"
                dataSource={insights}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Button type="link" size="small" icon={<ArrowRightOutlined />}>
                                {item.action}
                            </Button>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<Badge status={item.status as any} />}
                            title={
                                <Space>
                                    {item.icon}
                                    <Text strong>{item.text}</Text>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
            {insights.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
                    <CheckCircleOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#3f8600' }} />
                    <p>Mọi thứ đều ổn! Chưa có gợi ý mới.</p>
                </div>
            )}
        </GlassCard>
    );
};
