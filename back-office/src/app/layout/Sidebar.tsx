import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import {
    LayoutDashboard,
    ShoppingCart,
    CircleDollarSign,
    Package,
    Grip,
    Users,
    ShieldCheck,
    Layers
} from 'lucide-react';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermission } from '@/entities/user/hooks';
import { colors } from '@/shared/design-system/colors';
import { typography } from '@/shared/design-system/typography';
import { useLayout } from '@/shared/context/LayoutContext';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: 'group'
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
        type
    } as MenuItem;
}

export const Sidebar: React.FC = React.memo(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const { can, user } = usePermission();
    const { collapsed } = useLayout();

    const menuItems = useMemo(() => {
        const items: MenuItem[] = [];

        // Dashboard
        items.push(getItem('Dashboard', '/dashboard', <LayoutDashboard size={20} strokeWidth={2} />));

        const isAdmin = ['admin', 'manager'].includes(user?.role?.toString().toLowerCase() || '');

        // Sales Group
        const salesItems: MenuItem[] = [];
        if (isAdmin || can('order.read')) {
            salesItems.push(getItem('Orders', '/orders', <ShoppingCart size={20} strokeWidth={2} />));
        }
        if (isAdmin || can('auth.payment.read')) {
            salesItems.push(getItem('Transactions', '/transactions', <CircleDollarSign size={20} strokeWidth={2} />));
        }
        if (salesItems.length > 0) {
            items.push(getItem('SALES', 'sales-group', null, salesItems, 'group'));
        }

        // Operations Group
        const operationsItems: MenuItem[] = [];
        operationsItems.push(getItem('Inventory', '/inventory', <Package size={20} strokeWidth={2} />));
        if (operationsItems.length > 0) {
            items.push(getItem('OPERATIONS', 'ops-group', null, operationsItems, 'group'));
        }

        // Catalog Group
        const catalogItems: MenuItem[] = [];
        if (isAdmin || can('product.read')) {
            catalogItems.push(getItem('Products', '/products', <Grip size={20} strokeWidth={2} />));
        }
        if (isAdmin || can('product.category.read')) {
            catalogItems.push(getItem('Categories', '/categories', <Layers size={20} strokeWidth={2} />));
        }
        if (catalogItems.length > 0) {
            items.push(getItem('CATALOG', 'catalog-group', null, catalogItems, 'group'));
        }

        // Administration
        const adminItems: MenuItem[] = [];
        if (isAdmin || can('auth.user.read')) {
            adminItems.push(getItem('Users', '/users', <Users size={20} strokeWidth={2} />));
        }
        if (isAdmin || can('auth.role.read')) {
            adminItems.push(getItem('Roles & Permissions', '/roles', <ShieldCheck size={20} strokeWidth={2} />));
        }
        if (adminItems.length > 0) {
            items.push(getItem('ADMINISTRATION', 'admin-group', null, adminItems, 'group'));
        }

        return items;
    }, [can, user]);

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            collapsedWidth={80} // Updated for icon-only layout
            width={260}
            aria-label="Main Navigation"
            style={{
                background: 'var(--sidebar-gradient)',
                borderRight: `1px solid var(--sidebar-border)`,
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 'var(--z-sidebar)' as any,
                transition: 'all var(--sidebar-transition)',
                boxShadow: 'var(--sidebar-shadow)'
            }}
        >
            {/* Logo Area */}
            <div
                style={{
                    height: 64,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    marginBottom: 8
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        cursor: 'pointer',
                        transition: 'var(--transition-standard)'
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    <div style={{
                        fontFamily: typography.fontFamily.serif,
                        fontSize: collapsed ? '22px' : '20px',
                        fontWeight: 700,
                        color: colors.neutral.white,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        gap: '4px',
                        transition: 'var(--transition-standard)'
                    }}>
                        {collapsed ? (
                            <span style={{ color: colors.secondary.main }}>RP</span>
                        ) : (
                            <>
                                <span style={{ color: colors.secondary.main }}>Ray</span>
                                <span>Paradis</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <Menu
                theme="dark"
                selectedKeys={[location.pathname]}
                mode="inline"
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{
                    background: 'transparent',
                    borderRight: 0,
                    marginTop: 16,
                    padding: '0 8px'
                }}
            />
        </Sider>
    );
});
