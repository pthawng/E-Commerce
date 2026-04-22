import { HomeOutlined, BgColorsOutlined, BellOutlined, GlobalOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { List, Switch, Select, Typography, Divider, message } from 'antd';
import { PageContainer } from '@/app/layout/PageContainer';
import { SectionBlock } from '@/shared/ui';
import { useSettingsStore } from '@/entities/user/model/settingsStore';

const { Title } = Typography;

export const SettingsPage = () => {
    const {
        theme, setTheme,
        language, setLanguage,
        currency, setCurrency,
        compactMode, toggleCompactMode,
        notifications, updateNotifications
    } = useSettingsStore();

    return (
        <PageContainer
            breadcrumbItems={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: 'Account' },
                { title: 'Settings' },
            ]}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <SectionBlock>
                    <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BgColorsOutlined /> Appearance & Theme
                    </Title>
                    <Divider style={{ margin: '16px 0' }} />
                    <List itemLayout="horizontal">
                        <List.Item
                            actions={[
                                <Switch
                                    key="theme"
                                    checked={theme === 'dark'}
                                    checkedChildren="Dark"
                                    unCheckedChildren="Light"
                                    onChange={(checked) => {
                                        setTheme(checked ? 'dark' : 'light');
                                        message.success(`Switched to ${checked ? 'dark' : 'light'} mode`);
                                    }}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                title="Interface Appearance"
                                description="Toggle between light and dark visual themes"
                            />
                        </List.Item>
                        <List.Item
                            actions={[
                                <Switch
                                    key="compact"
                                    checked={compactMode}
                                    onChange={() => {
                                        toggleCompactMode();
                                        message.success('Compact mode updated');
                                    }}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                title="Compact Mode"
                                description="Reduce interface padding to show more content"
                            />
                        </List.Item>
                    </List>
                </SectionBlock>

                <div style={{ height: '24px' }} />

                <SectionBlock>
                    <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GlobalOutlined /> Locality & Region
                    </Title>
                    <Divider style={{ margin: '16px 0' }} />
                    <List itemLayout="horizontal">
                        <List.Item
                            actions={[
                                <Select
                                    value={language}
                                    style={{ width: 140 }}
                                    onChange={(val) => {
                                        setLanguage(val);
                                        message.success('Language changed');
                                    }}
                                    options={[
                                        { value: 'en-US', label: 'English (US)' },
                                        { value: 'vi-VN', label: 'Tiếng Việt' },
                                    ]}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                title="Display Language"
                                description="Choose your preferred interface language"
                            />
                        </List.Item>
                        <List.Item
                            actions={[
                                <Select
                                    value={currency}
                                    style={{ width: 140 }}
                                    onChange={(val) => {
                                        setCurrency(val);
                                        message.success('Currency preference updated');
                                    }}
                                    options={[
                                        { value: 'USD', label: 'USD ($)' },
                                        { value: 'VND', label: 'VND (₫)' },
                                    ]}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                title="Currency Format"
                                description="Standardize regional currency presentation"
                            />
                        </List.Item>
                    </List>
                </SectionBlock>

                <div style={{ height: '24px' }} />

                <SectionBlock>
                    <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BellOutlined /> Notification Preferences
                    </Title>
                    <Divider style={{ margin: '16px 0' }} />
                    <List itemLayout="horizontal">
                        <List.Item
                            actions={[
                                <Switch
                                    checked={notifications.emailSummaries}
                                    onChange={(checked) => {
                                        updateNotifications({ emailSummaries: checked });
                                        message.success('Notification settings saved');
                                    }}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                title="Email Summaries"
                                description="Receive a weekly performance summary of your store"
                            />
                        </List.Item>
                        <List.Item
                            actions={[
                                <Switch
                                    checked={notifications.operationalAlerts}
                                    onChange={(checked) => {
                                        updateNotifications({ operationalAlerts: checked });
                                        message.success('Notification settings saved');
                                    }}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                title="Operational Alerts"
                                description="Get notified about low stock or critical inventory issues"
                            />
                        </List.Item>
                    </List>
                </SectionBlock>
            </div>
        </PageContainer>
    );
};

export default SettingsPage;
