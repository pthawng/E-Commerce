import React, { useState } from 'react';
import { PageContainer } from '@/app/layout/PageContainer';
import { Space, Typography, Button, Input, Select, Row, Col } from 'antd';
import { ReloadOutlined, SwapOutlined, SearchOutlined, HistoryOutlined, ArrowRightOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import { queryKeys } from '@/shared/api/queryKeys';
import type { InventoryItem } from '../models/inventory.types';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema, RowActionConfig } from '@/shared/ui/DataTable';
import { GlassCard } from '@/shared/ui/GlassCard';
import { radius } from '@/shared/design-system/radius';
import { mapStockStatus, StatusRegistry } from '@/shared/registry/StatusRegistry';

const { Title, Text } = Typography;

// Add derived properties to InventoryItem for the schema
interface InventoryDisplayItem extends InventoryItem {
  available: number;
  stockStatus: string;
}

export const InventoryDashboard: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | undefined>(undefined);

  // Queries
  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: queryKeys.inventory.warehouses,
    queryFn: inventoryApi.getWarehouses,
  });

  const { data: stock, isLoading: isLoadingStock, refetch } = useQuery({
    queryKey: queryKeys.inventory.stock({ warehouseId: selectedWarehouse }),
    queryFn: () => inventoryApi.getStockLevels({ warehouseId: selectedWarehouse }),
  });

  // Derived Stats
  const totals = stock?.reduce((acc, item) => ({
    total: acc.total + item.quantity,
    reserved: acc.reserved + item.reservedQuantity,
    available: acc.available + (item.quantity - item.reservedQuantity)
  }), { total: 0, reserved: 0, available: 0 }) || { total: 0, reserved: 0, available: 0 };

  const lowStockCount = stock?.filter(item => (item.quantity - item.reservedQuantity) <= 20).length || 0;

  // Table Schema
  const schema: ColumnSchema<InventoryDisplayItem>[] = [
    {
      title: 'SKU Reference',
      key: 'productVariant.sku',
      type: 'id',
      width: 140,
    },
    {
      title: 'Facility',
      key: 'warehouse.name',
      type: 'text',
      width: 200,
    },
    {
      title: 'Physical Stock',
      key: 'quantity',
      type: 'number',
      width: 130,
      align: 'right',
    },
    {
      title: 'Reserved',
      key: 'reservedQuantity',
      type: 'number',
      width: 120,
      align: 'right',
    },
    {
      title: 'Available',
      key: 'available',
      type: 'number',
      width: 120,
      align: 'right',
    },
    {
      title: 'Stock Health',
      key: 'stockStatus',
      type: 'status-badge',
      width: 150,
      align: 'center',
      renderOptions: {
        statusMap: {
          [StatusRegistry.STOCK.IN_STOCK.label]: StatusRegistry.STOCK.IN_STOCK,
          [StatusRegistry.STOCK.LOW_STOCK.label]: StatusRegistry.STOCK.LOW_STOCK,
          [StatusRegistry.STOCK.OUT_OF_STOCK.label]: StatusRegistry.STOCK.OUT_OF_STOCK,
        }
      }
    },
    {
      title: 'Last Reconciled',
      key: 'updatedAt',
      type: 'date',
      width: 160,
    },
    {
      title: 'Actions',
      key: 'actions',
      type: 'actions',
      width: 120,
      align: 'right',
      renderOptions: {
        actions: (_record): RowActionConfig<InventoryDisplayItem>[] => [
          {
            key: 'view',
            label: 'View Logs',
            icon: <EyeOutlined />,
            onClick: (item) => console.log('Viewing', item)
          },
          {
            key: 'adjust',
            label: 'Adjust Stock',
            icon: <EditOutlined />,
            onClick: (item) => console.log('Adjusting', item)
          },
          {
            key: 'transfer',
            label: 'Fast Transfer',
            icon: <SwapOutlined />,
            onClick: (item) => console.log('Transferring', item)
          }
        ]
      }
    }
  ];

  const processedData = stock?.map(item => {
    const available = item.quantity - item.reservedQuantity;
    const stockStatus = mapStockStatus(available).label;
    return { ...item, available, stockStatus } as InventoryDisplayItem;
  }).filter(item =>
    item.productVariant?.sku.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <PageContainer
      action={
        <Space size="middle">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoadingStock}
            style={{ borderRadius: radius.xs }}
          >
            Refresh
          </Button>
          <Button
            icon={<HistoryOutlined />}
            style={{ borderRadius: radius.xs }}
          >
            Movement Logs
          </Button>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            style={{ borderRadius: radius.xs, fontWeight: 600 }}
          >
            Bulk Transfer
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>

        {/* Stock Health Summary */}
        <Row gutter={24}>
          <Col span={6}>
            <GlassCard variant="borderless">
              <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Stock</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{totals.total.toLocaleString()}</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>Units</Text>
              </div>
            </GlassCard>
          </Col>
          <Col span={6}>
            <GlassCard variant="borderless">
              <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reserved Capital</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--color-status-warning-text)' }}>{totals.reserved.toLocaleString()}</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>Awaiting Fulfillment</Text>
              </div>
            </GlassCard>
          </Col>
          <Col span={6}>
            <GlassCard variant="borderless">
              <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Liberty</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--color-status-success-text)' }}>{totals.available.toLocaleString()}</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>Sellable Units</Text>
              </div>
            </GlassCard>
          </Col>
          <Col span={6}>
            <GlassCard variant="borderless" style={{ background: lowStockCount > 0 ? 'rgba(var(--color-status-error-rgb), 0.05)' : 'transparent' }}>
              <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Pressure</Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: lowStockCount > 0 ? 'var(--color-status-error-text)' : 'var(--color-status-success-text)' }}>{lowStockCount}</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>SKUs below threshold</Text>
              </div>
            </GlassCard>
          </Col>
        </Row>

        {/* Main Content */}
        <GlassCard variant="borderless">
          <div style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
            <Input
              placeholder="Interrogate by SKU..."
              prefix={<SearchOutlined style={{ color: 'var(--color-neutral-400)' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: '400px', borderRadius: radius.xs, height: '42px' }}
            />
            <Select
              placeholder="Select Facility"
              style={{ width: '240px', height: '42px' }}
              allowClear
              loading={isLoadingWarehouses}
              onChange={value => setSelectedWarehouse(value)}
              options={warehouses?.map(w => ({ label: w.name, value: w.id }))}
            />
          </div>

          <LuxuryTable<InventoryDisplayItem>
            schema={schema}
            dataSource={processedData}
            loading={isLoadingStock}
            pagination={{ pageSize: 12 }}
            bulkActions={[
              {
                key: 'reconcile',
                label: 'Manual Reconcile',
                icon: <ArrowRightOutlined />,
                onClick: (objects) => console.log('Reconciling', objects)
              },
              {
                key: 'transfer',
                label: 'Initiate Transfer',
                icon: <SwapOutlined />,
                onClick: (objects) => console.log('Transferring', objects)
              }
            ]}
          />
        </GlassCard>
      </Space>
    </PageContainer>
  );
};
