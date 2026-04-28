import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Typography,
    Tabs,
    Form,
    Input,
    Switch,
    Button,
    Row,
    Col,
    Space,
    Divider,
    Select,
    Card,
    App,
    Empty,
    Spin,
    Popconfirm,
} from 'antd';
import {
    ShopOutlined,
    LockOutlined,
    BellOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    DeleteOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/entities/system/api/systemApi';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
    const { t } = useTranslation() as any;
    const { message, notification } = App.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const { data: settings, isLoading: isSettingsLoading } = useQuery({
        queryKey: ['system-settings'],
        queryFn: async () => {
            const response = await systemApi.getSettings();
            return response.data;
        },
    });

    const { data: sessions, isLoading: isSessionsLoading } = useQuery({
        queryKey: ['user-sessions'],
        queryFn: async () => {
            const response = await systemApi.getSessions();
            return response.data;
        },
    });

    useEffect(() => {
        if (settings) {
            form.setFieldsValue(settings);
        }
    }, [settings, form]);

    const updateSettingsMutation = useMutation({
        mutationFn: systemApi.updateSettings,
        onSuccess: () => {
            message.success(
                t('settings.footer.save_success', {
                    defaultValue: 'System configuration updated successfully.',
                })
            );
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
        },
        onError: (error: any) => {
            notification.error({
                message: t('settings.footer.save_failed', { defaultValue: 'Update Failed' }),
                description:
                    error.response?.data?.message ||
                    t('settings.footer.save_error_desc', { defaultValue: 'Could not update system settings.' }),
            });
        },
    });

    const revokeSessionMutation = useMutation({
        mutationFn: systemApi.revokeSession,
        onSuccess: () => {
            message.success(
                t('settings.security.revoke_success', { defaultValue: 'Session revoked successfully.' })
            );
            queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
        },
        onError: (error: any) => {
            message.error(t('settings.security.revoke_failed', { defaultValue: 'Failed to revoke session.' }));
        },
    });

    const handleSaveSettings = async () => {
        try {
            const values = await form.validateFields();
            updateSettingsMutation.mutate(values);
        } catch (error) {
            // Validation errors
        }
    };

    if (isSettingsLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Spin size="large" tip={t('settings.footer.saving')} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in duration-700">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <Title level={2} className="font-serif !mb-2">
                        {t('settings.title')}
                    </Title>
                    <Text className="text-gray-500 uppercase text-[10px] tracking-[0.2em] font-black">
                        {t('settings.subtitle')}
                    </Text>
                </div>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
                            queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
                        }}
                        className="rounded-none h-12"
                    >
                        {t('settings.sync')}
                    </Button>
                </Space>
            </header>

            <Tabs
                tabPosition="left"
                className="luxury-tabs"
                items={[
                    {
                        key: 'atelier',
                        label: (
                            <span className="flex items-center gap-3 px-4 py-2">
                                <ShopOutlined />
                                <span className="text-[11px] uppercase tracking-widest font-black">
                                    {t('settings.tabs.atelier')}
                                </span>
                            </span>
                        ),
                        children: (
                            <div className="pl-12 max-w-2xl">
                                <Form
                                    form={form}
                                    layout="vertical"
                                    className="space-y-12"
                                    initialValues={{
                                        atelier_name: 'Ray Paradis Main Vault',
                                        base_currency: 'USD',
                                        timezone: 'Paris',
                                        ledger_precision: 4,
                                        auto_reconciliation: true,
                                    }}
                                >
                                    <section>
                                        <Text className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black block mb-6">
                                            {t('settings.atelier.identity_region')}
                                        </Text>
                                        <div className="space-y-6">
                                            <Form.Item
                                                name="atelier_name"
                                                label={
                                                    <Text className="text-[11px] uppercase font-bold">
                                                        {t('settings.atelier.name')}
                                                    </Text>
                                                }
                                            >
                                                <Input className="h-12 rounded-none border-gray-200 focus:border-black" />
                                            </Form.Item>
                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="base_currency"
                                                        label={
                                                            <Text className="text-[11px] uppercase font-bold">
                                                                {t('settings.atelier.currency')}
                                                            </Text>
                                                        }
                                                    >
                                                        <Select
                                                            className="h-12 !rounded-none"
                                                            options={[
                                                                { value: 'USD', label: 'USD - United States Dollar' },
                                                                { value: 'EUR', label: 'EUR - Euro' },
                                                                { value: 'VND', label: 'VND - Vietnamese Dong' },
                                                            ]}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="timezone"
                                                        label={
                                                            <Text className="text-[11px] uppercase font-bold">
                                                                {t('settings.atelier.timezone')}
                                                            </Text>
                                                        }
                                                    >
                                                        <Select
                                                            className="h-12 !rounded-none"
                                                            options={[
                                                                { value: 'Paris', label: 'CET - Central European Time' },
                                                                { value: 'Saigon', label: 'ICT - Indochina Time' },
                                                            ]}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>
                                    </section>

                                    <Divider className="border-gray-100" />

                                    <section>
                                        <Text className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black block mb-6">
                                            {t('settings.atelier.operational_standards')}
                                        </Text>
                                        <div className="space-y-6">
                                            <Form.Item
                                                name="ledger_precision"
                                                label={
                                                    <Text className="text-[11px] uppercase font-bold">
                                                        {t('settings.atelier.ledger_precision')}
                                                    </Text>
                                                }
                                                help={t('settings.atelier.ledger_precision_help')}
                                            >
                                                <Select
                                                    className="h-12 !rounded-none"
                                                    options={[
                                                        { value: 2, label: '2 Decimal Places' },
                                                        { value: 4, label: '4 Decimal Places (High Precision)' },
                                                    ]}
                                                />
                                            </Form.Item>
                                            <div className="flex justify-between items-center bg-gray-50 p-6">
                                                <div>
                                                    <Text className="text-[11px] uppercase font-black block">
                                                        {t('settings.atelier.auto_reconciliation')}
                                                    </Text>
                                                    <Text className="text-[10px] text-gray-500">
                                                        {t('settings.atelier.reconciliation_desc')}
                                                    </Text>
                                                </div>
                                                <Form.Item name="auto_reconciliation" valuePropName="checked" noStyle>
                                                    <Switch className="bg-gray-200" />
                                                </Form.Item>
                                            </div>
                                        </div>
                                    </section>
                                </Form>
                            </div>
                        ),
                    },
                    {
                        key: 'security',
                        label: (
                            <span className="flex items-center gap-3 px-4 py-2">
                                <LockOutlined />
                                <span className="text-[11px] uppercase tracking-widest font-black">
                                    {t('settings.tabs.security')}
                                </span>
                            </span>
                        ),
                        children: (
                            <div className="pl-12 max-w-2xl">
                                <Text className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black block mb-8">
                                    {t('settings.security.access_sessions')}
                                </Text>
                                <div className="space-y-12">
                                    <Card className="rounded-none border-gray-100 shadow-sm bg-gray-50/50">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <SafetyCertificateOutlined className="text-green-600" />
                                                    <Text className="text-sm font-bold">
                                                        {t('settings.security.integrity')}
                                                    </Text>
                                                </div>
                                                <Text className="text-xs text-gray-500 block">
                                                    {t('settings.security.integrity_desc')}
                                                </Text>
                                            </div>
                                            <Button
                                                type="link"
                                                className="text-black font-black uppercase text-[10px]"
                                            >
                                                {t('settings.security.log')}
                                            </Button>
                                        </div>
                                    </Card>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <Text className="text-[11px] uppercase font-black block underline underline-offset-8">
                                                {t('settings.security.active_sessions')}
                                            </Text>
                                            <Text className="text-[10px] text-gray-400">
                                                {t('settings.security.active_devices', {
                                                    count: sessions?.length || 0,
                                                })}
                                            </Text>
                                        </div>
                                        <div className="space-y-0 border border-gray-100 divide-y divide-gray-50">
                                            {isSessionsLoading ? (
                                                <div className="p-8 text-center">
                                                    <Spin />
                                                </div>
                                            ) : sessions && sessions.length > 0 ? (
                                                sessions.map((session: any) => (
                                                    <div
                                                        key={session.id}
                                                        className="flex justify-between items-center p-6 hover:bg-gray-50/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400">
                                                                <GlobalOutlined />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <Text className="text-xs font-bold block">
                                                                        {session.deviceName || 'Unknown Device'}
                                                                    </Text>
                                                                    {session.id === sessions[0].id && (
                                                                        <span className="bg-green-100 text-green-700 text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-tight">
                                                                            {t('settings.security.active_now')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <Text className="text-[10px] text-gray-400">
                                                                    {session.ipAddress} •{' '}
                                                                    {t('settings.security.session_opened', {
                                                                        date: new Date(
                                                                            session.createdAt
                                                                        ).toLocaleString(),
                                                                    })}
                                                                </Text>
                                                            </div>
                                                        </div>
                                                        <Popconfirm
                                                            title={t('settings.security.revoke')}
                                                            description={t('settings.security.revoke_confirm')}
                                                            onConfirm={() => revokeSessionMutation.mutate(session.id)}
                                                            okText={t('settings.security.revoke_yes')}
                                                            cancelText={t('common.cancel')}
                                                            okButtonProps={{ danger: true, className: 'rounded-none' }}
                                                            cancelButtonProps={{ className: 'rounded-none' }}
                                                        >
                                                            <Button
                                                                type="text"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                loading={revokeSessionMutation.isPending}
                                                                className="text-[10px] uppercase font-black"
                                                            >
                                                                {t('settings.security.revoke')}
                                                            </Button>
                                                        </Popconfirm>
                                                    </div>
                                                ))
                                            ) : (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description={t('settings.security.no_sessions', {
                                                        defaultValue: 'No active sessions found.',
                                                    })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: 'notifications',
                        label: (
                            <span className="flex items-center gap-3 px-4 py-2">
                                <BellOutlined />
                                <span className="text-[11px] uppercase tracking-widest font-black">
                                    {t('settings.tabs.notifications')}
                                </span>
                            </span>
                        ),
                        children: (
                            <div className="pl-12 max-w-2xl">
                                <Text className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black block mb-8">
                                    {t('settings.notifications.protocols')}
                                </Text>
                                <div className="space-y-8">
                                    {[
                                        {
                                            key: 'notify_ledger',
                                            title: t('settings.notifications.ledger'),
                                            desc: t('settings.notifications.ledger_desc'),
                                            priority: 'High',
                                        },
                                        {
                                            key: 'notify_qc',
                                            title: t('settings.notifications.qc'),
                                            desc: t('settings.notifications.qc_desc'),
                                            priority: 'Medium',
                                        },
                                        {
                                            key: 'notify_material',
                                            title: t('settings.notifications.material'),
                                            desc: t('settings.notifications.material_desc'),
                                            priority: 'Medium',
                                        },
                                    ].map((n, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <Text className="text-[11px] uppercase font-black block">
                                                    {n.title}
                                                </Text>
                                                <Text className="text-[10px] text-gray-500">{n.desc}</Text>
                                            </div>
                                            <Form form={form} component={false}>
                                                <Form.Item name={n.key} valuePropName="checked" noStyle initialValue={true}>
                                                    <Switch className="bg-gray-200" />
                                                </Form.Item>
                                            </Form>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ),
                    },
                ]}
            />

            <footer className="mt-24 pt-8 border-t border-gray-100 flex justify-end gap-4">
                <Button
                    className="rounded-none border-gray-200 uppercase text-[10px] font-black tracking-widest h-12 px-8"
                    onClick={() => form.resetFields()}
                    disabled={updateSettingsMutation.isPending}
                >
                    {t('settings.footer.reset')}
                </Button>
                <Button
                    className="rounded-none bg-black text-white hover:opacity-90 border-none uppercase text-[10px] font-black tracking-widest h-12 px-8"
                    onClick={handleSaveSettings}
                    loading={updateSettingsMutation.isPending}
                >
                    {t('settings.footer.save')}
                </Button>
            </footer>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .luxury-tabs .ant-tabs-nav-list {
                    border-right: 1px solid #f0f0f0;
                    padding-right: 24px;
                }
                .luxury-tabs .ant-tabs-tab {
                    border-radius: 0 !important;
                    margin: 8px 0 !important;
                    transition: all 0.3s ease;
                }
                .luxury-tabs .ant-tabs-tab-active {
                    background: #fafafa !important;
                }
                .luxury-tabs .ant-tabs-ink-bar {
                    background: #000 !important;
                    width: 3px !important;
                }
             `,
                }}
            />
        </div>
    );
};

export default SettingsPage;
