import React from 'react';
import { Layout, Menu } from 'antd';
import {
    DesktopOutlined,
    FileOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

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

const items: MenuItem[] = [
    getItem('Dashboard', '1', <PieChartOutlined />),
    getItem('Orders', '2', <DesktopOutlined />),
    getItem('User', 'sub1', <UserOutlined />, [
        getItem('Tom', '3'),
        getItem('Bill', '4'),
        getItem('Alex', '5'),
    ]),
    getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
    getItem('Files', '9', <FileOutlined />),
];

interface SidebarProps {
    collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
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
                    }}
                >
                    Ray Paradis
                </div>
            </div>
            <Menu
                theme="dark"
                defaultSelectedKeys={['1']}
                mode="inline"
                items={items}
                style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
            />
        </Sider>
    );
};
