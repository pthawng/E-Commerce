import React from 'react';
import { Card, List, Avatar, Typography } from 'antd';

const { Text } = Typography;

const topProducts = [
    { id: 1, name: 'Premium Gold Ring', sales: 124, revenue: 12400 },
    { id: 2, name: 'Diamond Necklace', sales: 98, revenue: 29400 },
    { id: 3, name: 'Silver Bracelet', sales: 85, revenue: 4250 },
    { id: 4, name: 'Pearl Earrings', sales: 64, revenue: 5120 },
    { id: 5, name: 'Rose Gold Band', sales: 45, revenue: 8550 },
];

export const TopProducts: React.FC = () => {
    return (
        <Card title="Top Selling Products" bordered={false}>
            <List
                itemLayout="horizontal"
                dataSource={topProducts}
                renderItem={(item, index) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: '#f0f2f5', color: '#1890ff' }}>{index + 1}</Avatar>}
                            title={<Text strong>{item.name}</Text>}
                            description={`${item.sales} sales`}
                        />
                        <div style={{ textAlign: 'right' }}>
                            <Text strong style={{ color: '#3f8600' }}>
                                ${item.revenue.toLocaleString()}
                            </Text>
                        </div>
                    </List.Item>
                )}
            />
        </Card>
    );
};
