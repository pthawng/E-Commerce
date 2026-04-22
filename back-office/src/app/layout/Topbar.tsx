import React from 'react';
import { Layout, Button, Flex, Dropdown, Space, Typography, Badge } from 'antd';
import {
    Menu as MenuIcon,
    LogOut,
    Settings,
    Bell,
    Search,
    Plus,
    User,
    Command
} from 'lucide-react';
import { useAuth } from '@/entities/user/hooks';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Breadcrumb, Input } from 'antd';

import { colors } from '@/shared/design-system/colors';
import { typography } from '@/shared/design-system/typography';
import { useLayout } from '@/shared/context/LayoutContext';
import { UserAvatar } from '@/shared/ui';

const { Header } = Layout;
const { Text } = Typography;

export const Topbar: React.FC = () => {
    const { collapsed, setCollapsed } = useLayout();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const location = useLocation();
    const searchInputRef = React.useRef<any>(null);

    // Keyboard Shortcut for Search (Ctrl+K)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = () => {
        logout();
        queryClient.clear();
        navigate('/login', { replace: true });
    };

    const dropdownItems = [
        {
            key: 'profile-header',
            label: (
                <div style={{ padding: '8px 12px' }}>
                    <Text strong style={{ display: 'block', color: colors.text.primary }}>{user?.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{user?.email}</Text>
                </div>
            ),
            disabled: true,
        },
        { type: 'divider' as const },
        { key: 'my-profile', icon: <User size={16} />, label: 'Profile', onClick: () => navigate('/profile') },
        { key: 'account-settings', icon: <Settings size={16} />, label: 'Settings', onClick: () => navigate('/settings') },
        { type: 'divider' as const },
        {
            key: 'logout',
            label: 'Log out',
            icon: <LogOut size={16} />,
            danger: true,
            onClick: handleLogout,
        },
    ];

    const pathSnippets = location.pathname.split('/').filter(i => i);

    // Context-aware "Create" action logic
    const getCreateAction = () => {
        const page = pathSnippets[0];
        switch (page) {
            case 'orders': return { label: 'New Order', path: '/orders/create' };
            case 'products': return { label: 'New Product', path: '/products/create' };
            case 'categories': return { label: 'New Category', path: '/categories/create' };
            case 'attributes': return { label: 'New Attribute', path: '/attributes/create' };
            case 'users': return { label: 'New User', path: '/users/create' };
            case 'roles': return { label: 'New Role', path: '/roles/create' };
            case 'permissions': return { label: 'New Permission', path: '/permissions/create' };
            default: return null;
        }
    };

    const createAction = getCreateAction();

    const breadcrumbNameMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'orders': 'Orders',
        'transactions': 'Transactions',
        'inventory': 'Inventory',
        'products': 'Products',
        'categories': 'Categories',
        'attributes': 'Attributes',
        'users': 'Users',
        'roles': 'Roles & Permissions',
        'permissions': 'Manage Permissions',
        'create': 'Create New',
        'edit': 'Edit',
    };

    const breadcrumbItems = [
        {
            title: (
                <Link to="/dashboard" style={{
                    fontSize: '14px',
                    fontFamily: typography.fontFamily.sans,
                    color: 'var(--topbar-breadcrumb-parent)',
                    fontWeight: 500,
                    opacity: 0.6 // Even lower opacity for Root
                }}>
                    System
                </Link>
            ),
            key: 'home',
        },
        ...pathSnippets.map((snippet, index) => {
            const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
            const isLast = index === pathSnippets.length - 1;
            const name = breadcrumbNameMap[snippet] || (snippet.length > 20 ? snippet.slice(0, 8) + '...' : snippet);

            return {
                key: url,
                title: isLast ? (
                    <span style={{
                        fontSize: '14px',
                        fontFamily: typography.fontFamily.sans,
                        color: 'var(--topbar-breadcrumb-current)',
                        fontWeight: 700,
                        letterSpacing: '0.01em'
                    }}>
                        {name}
                    </span>
                ) : (
                    <Link to={url} style={{
                        fontSize: '14px',
                        fontFamily: typography.fontFamily.sans,
                        color: 'var(--topbar-breadcrumb-parent)',
                        fontWeight: 500,
                        opacity: 0.8
                    }}>
                        {name}
                    </Link>
                ),
            };
        }),
    ];

    return (
        <Header
            style={{
                padding: '0 24px',
                background: 'var(--topbar-glass-bg)',
                backdropFilter: 'blur(var(--topbar-blur))',
                borderBottom: `1px solid var(--topbar-border)`,
                height: 'var(--topbar-height)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-topbar)' as any,
                boxShadow: 'var(--topbar-shadow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'var(--transition-standard)'
            }}
        >
            {/* Left Section: Nav Toggle & Breadcrumb */}
            <Flex align="center" gap={16}>
                <Button
                    type="text"
                    icon={<MenuIcon size={20} strokeWidth={2} style={{ opacity: 0.7 }} />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        width: 40,
                        height: 40,
                        color: colors.neutral[600],
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'var(--transition-standard)'
                    }}
                    className="hover-bg-subtle"
                />
                <Breadcrumb
                    items={breadcrumbItems}
                    separator={<span style={{ color: colors.neutral[200], fontSize: '12px', margin: '0 4px' }}>/</span>}
                    style={{ marginLeft: 8 }}
                />
            </Flex>

            {/* Center Section: Global Search */}
            <div style={{ flex: 1, maxWidth: 520, margin: '0 40px' }}>
                <Input
                    ref={searchInputRef}
                    prefix={<Search size={18} strokeWidth={2.5} style={{ color: colors.neutral[400], marginRight: 4 }} />}
                    suffix={
                        <Flex align="center" gap={4} style={{
                            padding: '2px 6px',
                            background: colors.neutral[100],
                            borderRadius: 6,
                            border: `1px solid ${colors.neutral[200]}`,
                            opacity: 0.8
                        }}>
                            <Command size={10} strokeWidth={3} style={{ color: colors.neutral[500] }} />
                            <span style={{ fontSize: '10px', fontWeight: 800, color: colors.neutral[500], marginLeft: -1 }}>K</span>
                        </Flex>
                    }
                    placeholder="Search anything..."
                    variant="filled"
                    style={{
                        background: 'var(--topbar-search-bg)',
                        borderRadius: 12,
                        height: 42,
                        border: '1px solid transparent',
                        padding: '4px 12px',
                        transition: 'var(--transition-standard)'
                    }}
                    onFocus={(e) => {
                        e.target.style.boxShadow = 'var(--topbar-search-focus-shadow)';
                        e.target.style.borderColor = 'rgba(197, 160, 101, 0.4)';
                        e.target.style.background = '#FFFFFF';
                    }}
                    onBlur={(e) => {
                        e.target.style.boxShadow = 'none';
                        e.target.style.borderColor = 'transparent';
                        e.target.style.background = 'var(--topbar-search-bg)';
                    }}
                    className="topbar-search-input"
                />
            </div>

            {/* Right Section: Actions & Profile */}
            <Flex align="center" gap={16}>
                {createAction && (
                    <Button
                        type="primary"
                        icon={<Plus size={18} strokeWidth={2.5} />}
                        onClick={() => navigate(createAction.path)}
                        style={{
                            background: 'var(--color-primary)',
                            borderRadius: 10,
                            height: 40,
                            padding: '0 16px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(11, 37, 69, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        {createAction.label}
                    </Button>
                )}

                <Badge count={0} size="small" offset={[-4, 4]}>
                    <Button
                        type="text"
                        icon={<Bell size={20} strokeWidth={2} style={{ color: colors.neutral[600], opacity: 0.8 }} />}
                        style={{ width: 40, height: 40, borderRadius: 10 }}
                        className="hover-bg-subtle"
                    />
                </Badge>

                <Dropdown
                    menu={{ items: dropdownItems }}
                    trigger={['click']}
                    placement="bottomRight"
                >
                    <Space
                        style={{
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 10,
                            transition: 'var(--transition-standard)'
                        }}
                        className="hover-bg-subtle"
                    >
                        <UserAvatar
                            size={36}
                            src={user?.avatarUrl}
                            fullName={user?.fullName}
                        />
                        <Flex vertical gap={0} style={{ lineHeight: 1.1 }}>
                            <Text strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-primary)' }}>{user?.fullName}</Text>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, opacity: 0.6 }}>{user?.role}</Text>
                        </Flex>
                    </Space>
                </Dropdown>
            </Flex>
        </Header>
    );
};

