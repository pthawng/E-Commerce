import React, { memo } from 'react';
import { Row, Col, Typography } from 'antd';
import { RiseOutlined, GoldOutlined, TruckOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface OrderFulfillmentPulseProps {
    stats: {
        title: string;
        value: string | number;
        icon: React.ReactNode;
        color: string;
    }[];
}

export const OrderFulfillmentPulse: React.FC<OrderFulfillmentPulseProps> = memo(({ stats }) => {
    return (
        <Row gutter={[24, 24]}>
            {stats.map((s, i) => (
                <Col key={i} xs={12} lg={6}>
                    <div className="bg-[#fcfcfc] dark:bg-white/[0.02] border border-gray-50 dark:border-gray-900 p-6 space-y-2">
                        <div className="flex justify-between items-center">
                            <Text className="text-[10px] tracking-widest uppercase text-gray-400">{s.title}</Text>
                            <span className={s.color}>{s.icon}</span>
                        </div>
                        <Text className="text-2xl font-serif font-light block">{s.value}</Text>
                    </div>
                </Col>
            ))}
        </Row>
    );
});
