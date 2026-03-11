import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import {
    ContainerOutlined,
    DashboardOutlined,
    PicLeftOutlined,
    ShoppingOutlined,
    TeamOutlined,
    TagsOutlined,
    SafetyCertificateOutlined,
    IdcardOutlined,
    KeyOutlined,
    ShoppingCartOutlined,
    DollarOutlined,
    AppstoreAddOutlined,
    AppstoreOutlined,
    CarOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermission } from '@/entities/user/hooks';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

interface SidebarProps {
    collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { can, user } = usePermission();

    const menuItems = useMemo(() => {
        const items: MenuItem[] = [];

        // Dashboard (always visible if authenticated by default)
        items.push(getItem('Dashboard', '/dashboard', <DashboardOutlined />));

        const isAdmin = ['admin', 'manager'].includes(user?.role?.toString().toLowerCase() || '');

        // Sales & Commerce Group
        const salesItems: MenuItem[] = [];
        if (isAdmin || can('order.read')) {
            salesItems.push(getItem('Orders', '/orders', <ShoppingCartOutlined />));
        }
        if (isAdmin || can('auth.payment.read')) {
            salesItems.push(getItem('Transactions', '/transactions', <DollarOutlined />));
        }

        if (salesItems.length > 0) {
            items.push(getItem('Sales', 'sales', <ShoppingCartOutlined />, salesItems));
        }

        // Operations Group
        const operationsItems: MenuItem[] = [];
        operationsItems.push(getItem('Inventory', '/inventory', <AppstoreAddOutlined />));
        operationsItems.push(getItem(<span style={{ opacity: 0.5 }}>Shipments (Soon)</span>, 'shipments', <CarOutlined />));

        if (operationsItems.length > 0) {
            items.push(getItem('Operations', 'operations', <AppstoreOutlined />, operationsItems));
        }

        // Catalog Management Group
        const catalogItems: MenuItem[] = [];
        if (isAdmin || can('product.item.read') || can('product.read')) {
            catalogItems.push(getItem('Products', '/products', <ShoppingOutlined />));
        }
        if (isAdmin || can('product.category.read')) {
            catalogItems.push(getItem('Categories', '/categories', <PicLeftOutlined />));
        }
        if (isAdmin || can('product.attribute.read')) {
            catalogItems.push(getItem('Attributes', '/attributes', <TagsOutlined />));
        }

        if (catalogItems.length > 0) {
            items.push(getItem('Catalog', 'catalog', <ContainerOutlined />, catalogItems));
        }

        // Identity & Access
        const identityItems: MenuItem[] = [];
        if (isAdmin || can('auth.user.read') || can('user.read')) {
            identityItems.push(getItem('Users', '/users', <TeamOutlined />));
        }
        if (isAdmin || can('auth.role.read')) {
            identityItems.push(getItem('Roles', '/roles', <SafetyCertificateOutlined />));
            identityItems.push(getItem('Permissions', '/permissions', <KeyOutlined />));
        }

        if (identityItems.length > 0) {
            items.push(getItem('Identity & Access', 'identity', <IdcardOutlined />, identityItems));
        }

        return items;
    }, [can, user]);

    // Handle initial selection based on URL
    const openKeys = useMemo(() => {
        const keys = [];
        if (location.pathname.startsWith('/products') || location.pathname.startsWith('/categories') || location.pathname.startsWith('/attributes')) {
            keys.push('catalog');
        }
        if (location.pathname.startsWith('/orders') || location.pathname.startsWith('/transactions')) {
            keys.push('sales');
        }
        if (location.pathname.startsWith('/inventory') || location.pathname.startsWith('/shipments')) {
            keys.push('operations');
        }
        if (location.pathname.startsWith('/users') || location.pathname.startsWith('/roles') || location.pathname.startsWith('/permissions')) {
            keys.push('identity');
        }
        return keys;
    }, [location.pathname]);

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            collapsedWidth={0}
            style={{
                background: '#0B2545',
                borderRight: '1px solid rgba(255,255,255,0.05)',
            }}
            zeroWidthTriggerStyle={{
                top: '12px',
                right: '-40px',
                background: '#0B2545',
                borderRadius: '0 4px 4px 0',
            }}
        >
            <div
                style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#C5A065', // Gold
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    Ray Paradis
                </div>
            </div>
            <Menu
                theme="dark"
                selectedKeys={[location.pathname]}
                defaultOpenKeys={openKeys}
                mode="inline"
                items={menuItems}
                onClick={({ key }) => {
                    navigate(key);
                }}
                style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
            />
        </Sider>
    );
};

