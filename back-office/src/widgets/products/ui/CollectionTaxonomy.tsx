import React, { useState, memo, useCallback } from 'react';
import { 
    Tree, Typography, Button, Space, Card, Modal, 
    Form, Input, Select, Row, Col, InputNumber, 
    Switch, message, Popconfirm, Tooltip, Empty, Spin, Tag 
} from 'antd';
import { 
    PlusOutlined, DeleteOutlined, FolderOutlined, 
    FolderOpenOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoryApi, CategoryTreeNode, CreateCategoryPayload } from '@/shared/api/categoryApi';

const { Text } = Typography;

export const CollectionTaxonomy: React.FC = memo(() => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language.split('-')[0];
    const queryClient = useQueryClient();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [form] = Form.useForm();

    const getName = useCallback((name: Record<string, string> | null | undefined, fallback = '—') => {
        if (!name) return fallback;
        return name[currentLang] || name.en || name.vi || Object.values(name)[0] || fallback;
    }, [currentLang]);

    const { data: tree, isLoading } = useQuery({
        queryKey: ['pim-categories-tree'],
        queryFn: () => categoryApi.getTree(true),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCategoryPayload) => categoryApi.create(data),
        onSuccess: () => {
            message.success(t('dashboard.integrity.match_confirmed'));
            queryClient.invalidateQueries({ queryKey: ['pim-categories-tree'] });
            setCreateModalOpen(false);
            form.resetFields();
        },
        onError: (err: any) => message.error(err.response?.data?.message || t('dashboard.integrity.audit_failed')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryApi.delete(id),
        onSuccess: () => {
            message.success(t('common.delete'));
            queryClient.invalidateQueries({ queryKey: ['pim-categories-tree'] });
        },
    });

    const buildTreeData = (nodes: CategoryTreeNode[]): any[] => {
        return nodes.map(node => ({
            key: node.id,
            title: (
                <div className="flex items-center justify-between group w-full pr-4">
                    <Space size={8}>
                        <Text className="text-sm">{getName(node.name)}</Text>
                        {!node.isActive && <Tag color="default" className="text-[8px] m-0">{t('common.inactive')}</Tag>}
                        {node.path?.startsWith('collections') && <Tag color="purple" className="text-[8px] m-0">COLLECTION</Tag>}
                    </Space>
                    <Space className="opacity-0 group-hover:opacity-100 transition-opacity" size={4}>
                        <Tooltip title={t('products.categories.new')}>
                            <Button
                                type="text" size="small" icon={<PlusOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    form.setFieldsValue({ parentId: node.id });
                                    setCreateModalOpen(true);
                                }}
                            />
                        </Tooltip>
                        <Popconfirm
                            title={t('common.delete') + '?'}
                            onConfirm={(e) => { e?.stopPropagation(); deleteMutation.mutate(node.id); }}
                            onCancel={(e) => e?.stopPropagation()}
                        >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
                        </Popconfirm>
                    </Space>
                </div>
            ),
            children: node.children?.length ? buildTreeData(node.children) : undefined,
            icon: node.children?.length ? <FolderOpenOutlined className="text-amber-500" /> : <FolderOutlined className="text-gray-300" />,
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Text className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    {t('products.categories.title')}
                </Text>
                <Button icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}
                    className="h-10 px-6 uppercase tracking-widest text-[9px] font-bold">
                    {t('products.categories.new')}
                </Button>
            </div>

            <Card className="shadow-none border-gray-100 dark:border-gray-900 rounded-none bg-gray-50/20">
                {isLoading ? <Spin className="w-full py-20" /> : (
                    tree && tree.length > 0 ? (
                        <Tree
                            showIcon
                            treeData={buildTreeData(tree)}
                            defaultExpandAll
                            className="bg-transparent"
                            blockNode
                        />
                    ) : (
                        <Empty description={t('common.no_data')} />
                    )
                )}
            </Card>

            <Modal
                title={<span className="font-serif">{t('products.categories.create_modal')}</span>}
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
                className="luxury-modal"
            >
                <Form form={form} layout="vertical" onFinish={(values) => {
                    createMutation.mutate({
                        name: { vi: values.nameVi, en: values.nameEn || '' },
                        parentId: values.parentId || undefined,
                        isActive: values.isActive ?? true,
                        order: values.order || 0,
                    });
                }}>
                    <Form.Item name="nameVi" label={t('products.categories.name_vi')} rules={[{ required: true }]}>
                        <Input placeholder="Nhẫn cưới" className="rounded-none h-10" />
                    </Form.Item>
                    <Form.Item name="nameEn" label={t('products.categories.name_en')}>
                        <Input placeholder="Wedding Rings" className="rounded-none h-10" />
                    </Form.Item>
                    <Form.Item name="parentId" label={t('products.categories.parent')}>
                        <Select allowClear placeholder={t('common.search_placeholder')} className="luxury-select">
                            {tree?.map(c => <Select.Option key={c.id} value={c.id}>{getName(c.name)}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="order" label={t('products.categories.order')}>
                                <InputNumber min={0} className="w-full rounded-none h-10 leading-10" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="isActive" label={t('products.categories.active')} valuePropName="checked" initialValue={true}>
                                <Switch checkedChildren={t('inventory.status.active')} unCheckedChildren={t('common.inactive')} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
});
