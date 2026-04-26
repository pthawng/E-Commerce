import React, { useState, useMemo, memo } from 'react';
import { 
    Table, 
    Tag, 
    Space, 
    Input, 
    Card, 
    Typography, 
    Button, 
    Modal, 
    Form, 
    Switch, 
    message,
    Tooltip
} from 'antd';
import { 
    SearchOutlined, 
    PlusOutlined, 
    EditOutlined,
    BankOutlined,
    EnvironmentOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { inventoryApi, Warehouse } from '@/shared/api/inventoryApi';

const { Text, Title } = Typography;

export const WarehouseManagement: React.FC = memo(() => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [form] = Form.useForm();

    const { data: warehouses, isLoading, refetch } = useQuery({
        queryKey: ['inventory-warehouses'],
        queryFn: () => inventoryApi.getWarehouses(),
    });

    const filteredWarehouses = useMemo(() => {
        return warehouses?.filter(w => 
            w.name.toLowerCase().includes(search.toLowerCase()) ||
            w.code.toLowerCase().includes(search.toLowerCase())
        ) || [];
    }, [warehouses, search]);

    const createMutation = useMutation({
        mutationFn: inventoryApi.createWarehouse,
        onSuccess: () => {
            message.success(t('inventory.warehouses.success.create'));
            queryClient.invalidateQueries({ queryKey: ['inventory-warehouses'] });
            closeModal();
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Error creating vault');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => inventoryApi.updateWarehouse(id, data),
        onSuccess: () => {
            message.success(t('inventory.warehouses.success.update'));
            queryClient.invalidateQueries({ queryKey: ['inventory-warehouses'] });
            closeModal();
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Error updating vault');
        }
    });

    const handleEdit = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        form.setFieldsValue({
            name: warehouse.name,
            code: warehouse.code,
            address: warehouse.address,
            isActive: warehouse.isActive
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingWarehouse(null);
        form.resetFields();
    };

    const onFinish = (values: any) => {
        if (editingWarehouse) {
            updateMutation.mutate({ id: editingWarehouse.id, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const columns = [
        {
            title: t('inventory.warehouses.table.name'),
            key: 'name',
            render: (_: any, record: Warehouse) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                        <BankOutlined className="text-gray-400" />
                    </div>
                    <div>
                        <Text strong className="font-serif block leading-tight">{record.name}</Text>
                        <Text type="secondary" className="text-[10px] uppercase tracking-tighter">{record.code}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: t('inventory.warehouses.table.address'),
            dataIndex: 'address',
            key: 'address',
            render: (address: { city?: string; country?: string; province?: string } | undefined) => {
                const addressStr = address ? [address.province, address.city, address.country].filter(Boolean).join(', ') : null;
                return (
                    <Space size={4}>
                        <EnvironmentOutlined className="text-gray-300" />
                        <Text className="text-sm italic text-gray-500 font-serif">{addressStr || 'N/A'}</Text>
                    </Space>
                );
            }
        },
        {
            title: t('inventory.warehouses.table.status'),
            dataIndex: 'isActive',
            key: 'status',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'success' : 'default'} className="rounded-none border-none uppercase text-[9px] font-bold tracking-widest px-2">
                    {isActive ? t('common.live') : t('common.inactive')}
                </Tag>
            )
        },
        {
            title: t('common.actions'),
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: Warehouse) => (
                <Tooltip title={t('common.edit')}>
                    <Button 
                        type="text" 
                        icon={<EditOutlined className="text-gray-400 hover:text-black dark:hover:text-[#d4af37]" />} 
                        onClick={() => handleEdit(record)}
                    />
                </Tooltip>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <Title level={4} className="!mb-0 font-serif italic text-gray-800 dark:text-gray-100">
                        {t('inventory.warehouses.title')}
                    </Title>
                    <Text type="secondary" className="text-[10px] uppercase tracking-[0.2em] font-bold">
                        Architectural Asset Registry
                    </Text>
                </div>
                <Space size="middle">
                    <Input
                        prefix={<SearchOutlined className="text-gray-300" />}
                        placeholder={t('inventory.warehouses.search')}
                        className="h-10 w-72 border-gray-100 dark:border-gray-900 bg-transparent rounded-none text-[11px]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        allowClear
                    />
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={() => refetch()} 
                        type="text"
                        className="text-gray-400 hover:text-black dark:hover:text-white"
                    />
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 px-6 bg-black dark:bg-[#d4af37] border-none uppercase tracking-widest text-[9px] font-bold"
                    >
                        {t('inventory.warehouses.add')}
                    </Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={filteredWarehouses}
                loading={isLoading}
                rowKey="id"
                pagination={false}
                className="luxury-table border border-gray-100 dark:border-gray-900"
            />

            <Modal
                title={
                    <span className="font-serif italic text-lg">
                        {editingWarehouse ? t('inventory.warehouses.edit') : t('inventory.warehouses.add')}
                    </span>
                }
                open={isModalOpen}
                onCancel={closeModal}
                footer={null}
                width={500}
                centered
                className="luxury-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ isActive: true }}
                    className="pt-4"
                >
                    <Form.Item
                        name="name"
                        label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{t('inventory.warehouses.form.name')}</span>}
                        rules={[{ required: true, message: 'Please input vault name' }]}
                    >
                        <Input className="luxury-input h-11" />
                    </Form.Item>

                    <Form.Item
                        name="code"
                        label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{t('inventory.warehouses.form.code')}</span>}
                        rules={[{ required: true, message: 'Please input vault code' }]}
                    >
                        <Input className="luxury-input h-11" placeholder="e.g. WH-LON-01" />
                    </Form.Item>

                    <Form.Item
                        name="address"
                        label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{t('inventory.warehouses.form.address')}</span>}
                    >
                        <Input.TextArea rows={3} className="luxury-input pt-3" />
                    </Form.Item>

                    <Form.Item
                        name="isActive"
                        label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{t('inventory.warehouses.form.active')}</span>}
                        valuePropName="checked"
                    >
                        <Switch className="luxury-switch" />
                    </Form.Item>

                    <div className="flex justify-end space-x-3 mt-8">
                        <Button onClick={closeModal} className="h-10 border-gray-200 dark:border-gray-800 text-[10px] font-bold uppercase tracking-widest">
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={createMutation.isPending || updateMutation.isPending}
                            className="h-10 bg-black dark:bg-[#d4af37] border-none px-8 text-[10px] font-bold uppercase tracking-widest"
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
});
