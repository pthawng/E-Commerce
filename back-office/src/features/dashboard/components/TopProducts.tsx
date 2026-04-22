import React from 'react';
import { List, Avatar, Typography } from 'antd';
import { GlassCard } from '@/shared/ui/GlassCard';
import { colors } from '@/shared/design-system/colors';
import { typography } from '@/shared/design-system/typography';
import { useTopProducts } from '@/entities/dashboard/model/queries';

const { Text } = Typography;

export const TopProducts: React.FC = () => {
    const { data: products, isLoading } = useTopProducts(5);

    return (
        <GlassCard
            title="Top Collections"
            variant="borderless"
            loading={isLoading}
        >
            <List
                itemLayout="horizontal"
                dataSource={products || []}
                renderItem={(item, index) => (
                    <List.Item style={{ padding: 'var(--space-md) 0', borderBottom: 'none' }}>
                        <List.Item.Meta
                            avatar={
                                <Avatar style={{
                                    backgroundColor: `${colors.secondary.main}12`,
                                    color: colors.secondary.main,
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    border: 'none'
                                }}>
                                    {index + 1}
                                </Avatar>
                            }
                            title={<Text strong style={{ color: colors.primary.main, fontFamily: typography.fontFamily.sans }}>{item.name}</Text>}
                            description={<span style={{ fontSize: '12px', color: colors.neutral[500] }}>{item.sales} units sold</span>}
                        />
                        <div style={{ textAlign: 'right' }}>
                            <Text strong style={{ color: colors.primary.main, fontSize: '15px', fontFamily: typography.fontFamily.serif }}>
                                ${item.revenue.toLocaleString('en-US')}
                            </Text>
                        </div>
                    </List.Item>
                )}
            />
        </GlassCard>
    );
};
