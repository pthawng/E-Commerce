import React from 'react';
import { Layout, Button, theme, Flex } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const { Header } = Layout;

interface TopbarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ collapsed, setCollapsed }) => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    return (
        <Header style={{ padding: '0 16px', background: colorBgContainer }}>
            <Flex align="center" gap={16}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        fontSize: '16px',
                        width: 40,
                        height: 40,
                    }}
                />
                <h3
                    style={{
                        margin: 0,
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#0F172A', // Neutral 900
                    }}
                >
                    Back Office
                </h3>
            </Flex>
        </Header>
    );
};
