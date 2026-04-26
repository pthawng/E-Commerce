import React, { useState, memo, useCallback } from 'react';
import { 
    Typography, Space, Button, Card, Modal, Form, 
    Input, Select, Tag, Popconfirm, message, Spin, 
    Empty, Collapse 
} from 'antd';
import { 
    PlusOutlined, ExperimentOutlined, SafetyCertificateOutlined, 
    TagsOutlined, DeleteOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { attributeApi, AttributeItem } from '@/shared/api/attributeApi';

const { Text } = Typography;

export const AttributeRegistry: React.FC = memo(() => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language.split('-')[0];
    const queryClient = useQueryClient();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [form] = Form.useForm();

    const getName = useCallback((name: Record<string, string> | null | undefined, fallback = '—') => {
        if (!name) return fallback;
        return name[currentLang] || name.en || name.vi || Object.values(name)[0] || fallback;
    }, [currentLang]);

    const { data: attributes, isLoading } = useQuery({
        queryKey: ['pim-attributes'],
        queryFn: () => attributeApi.getAll(),
    });

    const seedMutation = useMutation({
        mutationFn: () => attributeApi.seedJewelryAttributes(),
        onSuccess: (results) => {
            if (results.length > 0) {
                message.success(t('dashboard.integrity.match_confirmed'));
            } else {
                message.info(t('common.no_data'));
            }
            queryClient.invalidateQueries({ queryKey: ['pim-attributes'] });
        },
        onError: () => message.error(t('dashboard.integrity.audit_failed')),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => attributeApi.create(data),
        onSuccess: () => {
            message.success(t('dashboard.integrity.match_confirmed'));
            queryClient.invalidateQueries({ queryKey: ['pim-attributes'] });
            setCreateModalOpen(false);
            form.resetFields();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => attributeApi.delete(id),
        onSuccess: () => {
            message.success(t('common.delete'));
            queryClient.invalidateQueries({ queryKey: ['pim-attributes'] });
        },
    });

    const filterTypeBadge = (type: string) => {
        const map: Record<string, { color: string; label: string }> = {
            'select': { color: 'blue', label: 'SELECT' },
            'multiselect': { color: 'purple', label: 'MULTI' },
            'swatch_color': { color: 'gold', label: 'SWATCH' },
            'swatch_image': { color: 'orange', label: 'IMAGE' },
            'text': { color: 'default', label: 'TEXT' },
            'boolean': { color: 'green', label: 'BOOL' },
        };
        const info = map[type] || { color: 'default', label: type };
        return <Tag color={info.color} className="text-[8px] uppercase tracking-widest m-0">{info.label}</Tag>;
    };

    const technicalCodes = ['material_type', 'stone_type', 'stone_clarity', 'stone_cut', 'certification', 'ring_size', 'material_purity'];
    const technical = attributes?.filter(a => technicalCodes.includes(a.code)) || [];
    const marketing = attributes?.filter(a => !technicalCodes.includes(a.code)) || [];

    const renderAttributeGroup = (title: string, icon: React.ReactNode, items: AttributeItem[]) => (
        <Card title={
            <Space>
                {icon}
                <Text className="text-xs uppercase tracking-widest font-bold">{title}</Text>
                <Tag className="text-[8px] m-0">{items.length}</Tag>
            </Space>
        } className="shadow-none border-gray-100 dark:border-gray-900 rounded-none bg-gray-50/10">
            {items.length === 0 ? (
                <Empty description={t('common.no_data')} className="py-6" />
            ) : (
                <Collapse ghost expandIconPosition="start" items={items.map(attr => ({
                    key: attr.id,
                    label: (
                        <div className="flex items-center justify-between w-full pr-4">
                            <Space size={8}>
                                <Text strong className="text-sm">{getName(attr.name)}</Text>
                                <Text code className="text-[9px]">{attr.code}</Text>
                                {filterTypeBadge(attr.filterType)}
                            </Space>
                            <Space size={4}>
                                <Tag className="text-[8px] m-0">{attr.values?.length || 0} values</Tag>
                                <Popconfirm title={t('common.delete') + '?'} onConfirm={() => deleteMutation.mutate(attr.id)}>
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
                                </Popconfirm>
                            </Space>
                        </div>
                    ),
                    children: (
                        <div className="pl-6">
                            <div className="flex flex-wrap gap-2">
                                {attr.values?.map(v => (
                                    <Tag key={v.id} className="text-xs py-1 px-3 rounded-sm border-gray-200 dark:border-gray-800">
                                        {attr.filterType === 'swatch_color' && v.metaValue && (
                                            <span className="inline-block w-3 h-3 rounded-full mr-2 border dark:border-gray-700" style={{ backgroundColor: v.metaValue }} />
                                        )}
                                        {getName(v.value)}
                                        {v.metaValue && <Text type="secondary" className="ml-2 text-[9px]">({v.metaValue})</Text>}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    ),
                }))} />
            )}
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Text className="text-[10px] uppercase tracking-widest text-gray-400 font-bold border-l-2 border-blue-400 pl-3">
                    {t('products.attributes.title')}
                </Text>
                <Space>
                    <Button
                        icon={<ExperimentOutlined />}
                        onClick={() => seedMutation.mutate()}
                        loading={seedMutation.isPending}
                        className="h-10 px-6 uppercase tracking-widest text-[9px] font-bold"
                    >
                        {t('products.attributes.seed')}
                    </Button>
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalOpen(true)}
                        className="h-10 px-6 uppercase tracking-widest text-[9px] font-bold bg-black text-white border-none dark:bg-[#d4af37]"
                    >
                        {t('products.attributes.new')}
                    </Button>
                </Space>
            </div>

            {isLoading ? <Spin className="w-full py-20" /> : (
                <div className="space-y-6">
                    {renderAttributeGroup(t('products.attributes.technical'), <SafetyCertificateOutlined className="text-blue-500" />, technical)}
                    {renderAttributeGroup(t('products.attributes.marketing'), <TagsOutlined className="text-purple-500" />, marketing)}
                </div>
            )}

            <Modal
                title={<span className="font-serif">{t('products.attributes.create_modal')}</span>}
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
                className="luxury-modal"
            >
                <Form form={form} layout="vertical" onFinish={(values) => {
                    createMutation.mutate({
                        code: values.code,
                        name: { vi: values.nameVi, en: values.nameEn || '' },
                        filterType: values.filterType || 'select',
                    });
                }}>
                    <Form.Item name="code" label="Code" rules={[{ required: true }, { pattern: /^[a-z_]+$/, message: 'Lowercase + underscore only' }]}>
                        <Input placeholder="stone_color" className="rounded-none h-10" />
                    </Form.Item>
                    <Form.Item name="nameVi" label={t('products.categories.name_vi')} rules={[{ required: true }]}>
                        <Input placeholder="Màu đá" className="rounded-none h-10" />
                    </Form.Item>
                    <Form.Item name="nameEn" label={t('products.categories.name_en')}>
                        <Input placeholder="Stone Color" className="rounded-none h-10" />
                    </Form.Item>
                    <Form.Item name="filterType" label="Filter Type" initialValue="select">
                        <Select className="luxury-select">
                            <Select.Option value="select">Select</Select.Option>
                            <Select.Option value="multiselect">Multi-select</Select.Option>
                            <Select.Option value="swatch_color">Swatch (Color)</Select.Option>
                            <Select.Option value="swatch_image">Swatch (Image)</Select.Option>
                            <Select.Option value="text">Text</Select.Option>
                            <Select.Option value="boolean">Boolean</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
});
