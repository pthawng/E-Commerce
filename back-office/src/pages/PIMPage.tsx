import React from 'react';
import { Tabs, Space } from 'antd';
import { 
    GoldOutlined, FolderOutlined, TagsOutlined, 
    BarChartOutlined 
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { WidgetErrorBoundary } from '@/shared/ui/ErrorBoundary/WidgetErrorBoundary';

// Widgets
import { ProductCatalog } from '@/widgets/products/ui/ProductCatalog';
import { CollectionTaxonomy } from '@/widgets/products/ui/CollectionTaxonomy';
import { AttributeRegistry } from '@/widgets/products/ui/AttributeRegistry';
import { MaterialLedgerLink } from '@/widgets/products/ui/MaterialLedgerLink';

export const PIMPage: React.FC = () => {
    const { t } = useTranslation();

    usePageHeader({
        title: t('products.title'),
        subtitle: t('products.subtitle'),
    });

    return (
        <div className="pb-8 animate-in fade-in duration-1000">
            <Tabs
                defaultActiveKey="catalog"
                className="luxury-tabs"
                items={[
                    {
                        key: 'catalog',
                        label: (
                            <Space size={6}>
                                <GoldOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('products.tabs.catalog')}</span>
                            </Space>
                        ),
                        children: (
                            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                                <ProductCatalog />
                            </WidgetErrorBoundary>
                        ),
                    },
                    {
                        key: 'categories',
                        label: (
                            <Space size={6}>
                                <FolderOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('products.tabs.categories')}</span>
                            </Space>
                        ),
                        children: (
                            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                                <CollectionTaxonomy />
                            </WidgetErrorBoundary>
                        ),
                    },
                    {
                        key: 'attributes',
                        label: (
                            <Space size={6}>
                                <TagsOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('products.tabs.attributes')}</span>
                            </Space>
                        ),
                        children: (
                            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                                <AttributeRegistry />
                            </WidgetErrorBoundary>
                        ),
                    },
                    {
                        key: 'ledger',
                        label: (
                            <Space size={6}>
                                <BarChartOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">{t('products.tabs.ledger')}</span>
                            </Space>
                        ),
                        children: (
                            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title')}>
                                <MaterialLedgerLink />
                            </WidgetErrorBoundary>
                        ),
                    },
                ]}
            />
        </div>
    );
};

export default PIMPage;
