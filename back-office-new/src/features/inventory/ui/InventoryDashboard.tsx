import React, { useState } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Space, 
  Button, 
  Tag, 
  Input, 
  Select, 
  Row, 
  Col, 
  Tooltip,
} from 'antd';
import { 
  ReloadOutlined, 
  SwapOutlined, 
  WarningOutlined, 
  SearchOutlined,
  HistoryOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import { queryKeys } from '@/shared/api/queryKeys';
import type { InventoryItem } from '../models/inventory.types';

const { Title, Text } = Typography;

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

  // Table Columns
  const columns = [
    {
      title: 'Product SKU',
      dataIndex: ['productVariant', 'sku'],
      key: 'sku',
      render: (sku: string) => <Text strong>{sku}</Text>,
    },
    {
      title: 'Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      render: (name: string, _record: InventoryItem) => (
        <Space>
          <HomeOutlined style={{ color: '#C5A065' }} />
          <Text>{name}</Text>
          <Tag>{_record.warehouse?.code}</Tag>
        </Space>
      ),
    },
    {
      title: 'Total Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: InventoryItem, b: InventoryItem) => a.quantity - b.quantity,
      render: (qty: number) => <Text style={{ fontSize: '16px' }}>{qty}</Text>,
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reserved',
      render: (reserved: number) => (
        <Text type={reserved > 0 ? 'warning' : 'secondary'}>{reserved}</Text>
      ),
    },
    {
      title: 'Available',
      key: 'available',
      render: (_: any, _record: InventoryItem) => {
        const available = _record.quantity - _record.reservedQuantity;
        const status = available <= 10 ? 'error' : available <= 50 ? 'warning' : 'success';
        return <Tag color={status}>{available}</Tag>;
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, _record: InventoryItem) => (
        <Space>
          <Tooltip title="Transfer Stock">
            <Button icon={<SwapOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Report Damage">
            <Button icon={<WarningOutlined />} danger size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredData = stock?.filter(item => 
    item.productVariant?.sku.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0, color: '#C5A065' }}>Inventory Management</Title>
          <Text type="secondary">Monitor and manage stock across all warehouses</Text>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
              loading={isLoadingStock}
            >
              Refresh
            </Button>
            <Button icon={<HistoryOutlined />}>Movement History</Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input 
              placeholder="Search by SKU..." 
              prefix={<SearchOutlined />} 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="All Warehouses"
              style={{ width: '100%' }}
              allowClear
              loading={isLoadingWarehouses}
              onChange={value => setSelectedWarehouse(value)}
              options={warehouses?.map(w => ({ label: w.name, value: w.id }))}
            />
          </Col>
        </Row>
      </Card>

      <Table 
        columns={columns} 
        dataSource={filteredData} 
        rowKey="id"
        loading={isLoadingStock}
        pagination={{ pageSize: 10 }}
        style={{ 
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      />
    </Space>
  );
};
