import React from 'react';
import { Tabs, Space } from 'antd';
import { TeamOutlined, GlobalOutlined, RiseOutlined, StarFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { WidgetErrorBoundary } from '@/shared/ui/ErrorBoundary/WidgetErrorBoundary';

// Widgets
import { ClientDirectory } from '@/widgets/crm/ui/ClientDirectory';
import { GuestRegistry } from '@/widgets/crm/ui/GuestRegistry';
import { LifecycleIntelligence } from '@/widgets/crm/ui/LifecycleIntelligence';

export const CRMPage: React.FC = () => {
    const { t } = useTranslation();
    
    usePageHeader({
        title: t('crm.title'),
        subtitle: t('crm.subtitle'),
    });

    return (
        <div className="pb-8 animate-in fade-in duration-1000">
            <Tabs
                defaultActiveKey="directory"
                className="luxury-tabs"
                items={[
                    {
                        key: 'directory',
                        label: (
                            <Space size={6}>
                                <TeamOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('crm.tabs.directory')}</span>
                            </Space>
                        ),
                        children: (
                            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                                <ClientDirectory />
                            </WidgetErrorBoundary>
                        ),
                    },
                    {
                        key: 'guests',
                        label: (
                            <Space size={6}>
                                <GlobalOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('crm.tabs.guests')}</span>
                            </Space>
                        ),
                        children: (
                            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                                <GuestRegistry />
                            </WidgetErrorBoundary>
                        ),
                    },
                    {
                        key: 'lifecycle',
                        label: (
                            <Space size={6}>
                                <RiseOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('crm.tabs.intelligence')}</span>
                            </Space>
                        ),
                        children: (
                            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                                <LifecycleIntelligence />
                            </WidgetErrorBoundary>
                        ),
                    },
                    {
                        key: 'feedback',
                        label: (
                            <Space size={6}>
                                <StarFilled className="text-gray-400" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('crm.tabs.feedback')}</span>
                            </Space>
                        ),
                        children: (
                            <div className="py-20 text-center uppercase tracking-widest text-gray-300 font-bold text-xs border border-dashed border-gray-100 dark:border-gray-900">
                                {t('common.coming_soon')}
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );
};

export default CRMPage;
