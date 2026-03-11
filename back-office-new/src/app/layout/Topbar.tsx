import React from 'react';
import { Layout, Button, theme, Flex, Dropdown, Space, Avatar, Typography, Badge } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    SafetyCertificateOutlined,
    BgColorsOutlined,
    TranslationOutlined,
    QuestionCircleOutlined,
    BellOutlined
} from '@ant-design/icons';
import { useAuth } from '@/entities/user/hooks';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const { Header } = Layout;
const { Text } = Typography;

interface TopbarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ collapsed, setCollapsed }) => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handleLogout = () => {
        // 1. Clear auth store 
        logout();
        // 2. Clear query cache
        queryClient.clear();
        // 3. Redirect login
        navigate('/login', { replace: true });
    };

    const items = [
        {
            key: 'profile-header',
            label: (
                <div style={{ padding: '4px 0' }}>
                    <Text strong style={{ display: 'block' }}>{user?.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>{user?.email}</Text>
                </div>
            ),
            disabled: true, // Prevents selection styling while keeping it accessible
            style: { cursor: 'default' }
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'my-profile',
            icon: <UserOutlined />,
            label: 'My Profile',
        },
        {
            key: 'account-settings',
            icon: <SettingOutlined />,
            label: 'Account Settings',
        },
        {
            key: 'security',
            icon: <SafetyCertificateOutlined />,
            label: 'Security',
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'theme',
            icon: <BgColorsOutlined />,
            label: 'Theme',
        },
        {
            key: 'language',
            icon: <TranslationOutlined />,
            label: 'Language',
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'help-support',
            icon: <QuestionCircleOutlined />,
            label: 'Help / Support',
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: 'Log out',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <Header style={{ padding: '0 16px', background: colorBgContainer }}>
            <Flex align="center" justify="space-between" style={{ height: '100%' }}>
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
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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

                {user && (
                    <Flex align="center" gap={16}>
                        <Badge count={5} size="small" offset={[-2, 4]}>
                            <Button
                                type="text"
                                icon={<BellOutlined style={{ fontSize: '18px' }} />}
                                style={{
                                    width: 40,
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            />
                        </Badge>
                        <Dropdown
                            menu={{ items }}
                            trigger={['click']} // Ensures no hover behavior per requirements
                            placement="bottomRight"
                        // Ant Design's Dropdown natively supports ESC to close, Click outside to close, and TAB navigation
                        >
                            <Space
                                style={{ cursor: 'pointer', padding: '0 8px' }}
                                tabIndex={0}
                                role="button"
                                aria-haspopup="true"
                                aria-label="User menu"
                                onKeyDown={(e) => {
                                    // Allow Enter or Space to open the dropdown if focused via keyboard TAB
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.currentTarget.click();
                                    }
                                }}
                            >
                                <Avatar size="default" icon={<UserOutlined />} src={user.avatarUrl || undefined} />
                                <span style={{ fontWeight: 500 }}>{user.fullName}</span>
                            </Space>
                        </Dropdown>
                    </Flex>
                )}
            </Flex>
        </Header>
    );
};

