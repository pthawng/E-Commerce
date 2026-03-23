import React from 'react';
import { Layout } from 'antd';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Content } from './Content';
import { Outlet } from 'react-router-dom';
import { colors } from '@/shared/design-system/colors';

export default function AppShell() {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} />

            <Layout style={{ background: colors.background.body }}>
                <Topbar collapsed={collapsed} setCollapsed={setCollapsed} />

                <Content>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
