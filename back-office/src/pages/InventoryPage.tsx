import React from 'react';
import { Tabs, Space } from 'antd';
import { 
    SwapOutlined, 
    HistoryOutlined,
    DashboardOutlined,
    BankOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { StockTable } from '@/widgets/inventory/StockTable';
import { TransferManagement } from '@/widgets/inventory/TransferManagement';
import { WarehouseManagement } from '@/widgets/inventory/WarehouseManagement';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { WidgetErrorBoundary } from '@/shared/ui/ErrorBoundary/WidgetErrorBoundary';

export const InventoryPage: React.FC = () => {
    const { t } = useTranslation();

    usePageHeader({
        title: t('inventory.title'),
        subtitle: t('inventory.subtitle'),
    });

    const items = [
        {
            key: 'stock',
            label: (
                <Space size={6}>
                    <DashboardOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('inventory.tabs.stock')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    <StockTable />
                </WidgetErrorBoundary>
            ),
        },
        {
            key: 'transfers',
            label: (
                <Space size={6}>
                    <SwapOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('inventory.tabs.transfers')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    <TransferManagement />
                </WidgetErrorBoundary>
            ),
        },
        {
            key: 'warehouses',
            label: (
                <Space size={6}>
                    <BankOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('inventory.tabs.warehouses')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    <WarehouseManagement />
                </WidgetErrorBoundary>
            ),
        },
        {
            key: 'logs',
            label: (
                <Space size={6}>
                    <HistoryOutlined />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{t('inventory.tabs.logs')}</span>
                </Space>
            ),
            children: (
                <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                    <div className="p-20 text-center text-gray-300 italic font-serif border border-dashed border-gray-100 dark:border-gray-900">
                        {t('inventory.logs.placeholder')}
                    </div>
                </WidgetErrorBoundary>
            ),
        },
    ];

    return (
        <div className="pb-8 animate-in fade-in duration-1000">
            <Tabs
                defaultActiveKey="stock"
                className="luxury-tabs"
                items={items}
            />
        </div>
    );
};

export default InventoryPage;
