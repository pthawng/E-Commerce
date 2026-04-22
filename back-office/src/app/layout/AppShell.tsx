import { Layout } from 'antd';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Content } from './Content';
import { Outlet } from 'react-router-dom';
import { colors } from '@/shared/design-system/colors';
import { useLayout } from '@/shared/context/LayoutContext';

export default function AppShell() {
    // Layout context provides unified collapsed state and syncs CSS variables
    useLayout();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar />

            <Layout style={{
                background: colors.background.body,
                marginLeft: 'var(--sidebar-width)',
                transition: 'margin-left var(--sidebar-transition)',
                minHeight: '100vh',
                overflow: 'hidden'
            }}>
                <Topbar />

                <Content>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
