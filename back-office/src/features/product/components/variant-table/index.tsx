import { useState } from 'react';
import { Button, Modal, Space, Table, Tag, Form, Input, InputNumber, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Product, ProductMedia } from '@shared';
import {
    useVariants,
    useCreateVariant,
    useUpdateVariant,
    useDeleteVariant,
} from '../../hooks/hooks';
import type {
    CreateVariantPayload,
    UpdateVariantPayload,
    ProductVariant,
} from '../../services/variants';

interface VariantTableProps {
    product: Product;
}

interface VariantFormValues {
    sku?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    weightGram?: number;
    isDefault?: boolean;
    isActive?: boolean;
}

export function VariantTable({ product }: VariantTableProps) {
    const [form] = Form.useForm<VariantFormValues>();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMediaIndexes, setSelectedMediaIndexes] = useState<number[]>([]);

    const productId = product.id;
    const { data: variants = [], isLoading } = useVariants(productId);
    const createVariant = useCreateVariant(productId);
    const updateVariant = useUpdateVariant(productId);
    const deleteVariant = useDeleteVariant(productId);

    const columns: ColumnsType<ProductVariant> = [
        {
            title: 'SKU',
            dataIndex: 'sku',
        },
        {
            title: 'Giá bán',
            dataIndex: 'price',
            render: (v: number) => v?.toLocaleString('vi-VN'),
        },
        {
            title: 'Giá gốc',
            dataIndex: 'compareAtPrice',
            render: (v?: number | null) => (v ? v.toLocaleString('vi-VN') : '-'),
        },
        {
            title: 'Giá vốn',
            dataIndex: 'costPrice',
            render: (v?: number | null) => (v ? v.toLocaleString('vi-VN') : '-'),
        },
        {
            title: 'Mặc định',
            dataIndex: 'isDefault',
            render: (v: boolean) =>
                v ? <Tag color="gold">DEFAULT</Tag> : <Tag color="default">-</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            render: (v: boolean) => (
                <Tag color={v ? 'green' : 'red'}>{v ? 'ACTIVE' : 'INACTIVE'}</Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: unknown, record: ProductVariant) => (
                <Space>
                    <Button size="small" type="link" onClick={() => openEdit(record)}>
                        Sửa
                    </Button>
                    <Button
                        size="small"
                        type="link"
                        danger
                        onClick={() => handleDelete(record.id)}
                        loading={deleteVariant.isPending}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const openCreate = () => {
        setEditingId(null);
        form.resetFields();
        form.setFieldsValue({
            isActive: true,
        } as VariantFormValues);
    setSelectedMediaIndexes([]);
        setModalOpen(true);
    };

    const openEdit = (record: ProductVariant) => {
        setEditingId(record.id);
        form.setFieldsValue({
            sku: record.sku,
            price: Number(record.price),
            compareAtPrice: record.compareAtPrice ? Number(record.compareAtPrice) : undefined,
            costPrice: record.costPrice ? Number(record.costPrice) : undefined,
            weightGram: record.weightGram ? Number(record.weightGram) : undefined,
            isDefault: record.isDefault,
            isActive: record.isActive,
        } as VariantFormValues);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const payload: CreateVariantPayload | UpdateVariantPayload = {
            sku: values.sku,
            price: values.price,
            compareAtPrice: values.compareAtPrice,
            costPrice: values.costPrice,
            weightGram: values.weightGram,
            isDefault: values.isDefault,
            isActive: values.isActive,
      mediaIndexes: selectedMediaIndexes.length ? selectedMediaIndexes : undefined,
        };

        if (editingId) {
            await updateVariant.mutateAsync({ id: editingId, payload });
        } else {
            await createVariant.mutateAsync(payload as CreateVariantPayload);
        }
        setModalOpen(false);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Xóa biến thể?',
            okType: 'danger',
            onOk: async () => {
                await deleteVariant.mutateAsync(id);
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="font-medium text-slate-700">Biến thể sản phẩm</div>
                <Button type="dashed" onClick={openCreate}>
                    Thêm biến thể
                </Button>
            </div>

            <Table<ProductVariant>
                rowKey="id"
                loading={isLoading}
                dataSource={variants || []}
                columns={columns}
                pagination={false}
                size="small"
            />

            <Modal
                title={editingId ? 'Sửa biến thể' : 'Thêm biến thể'}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setEditingId(null);
                    setSelectedMediaIndexes([]);
                }}
                onOk={handleSubmit}
                confirmLoading={createVariant.isPending || updateVariant.isPending}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="sku" label="SKU">
                        <Input placeholder="Để trống nếu muốn hệ thống auto-gen" />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Giá bán"
                        rules={[{ required: true, message: 'Nhập giá bán' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={1000}
                            placeholder="199000"
                        />
                    </Form.Item>
                    <Form.Item name="compareAtPrice" label="Giá gốc (nếu có)">
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={1000}
                            placeholder="249000"
                        />
                    </Form.Item>
                    <Form.Item name="costPrice" label="Giá vốn (nếu có)">
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={1000}
                            placeholder="120000"
                        />
                    </Form.Item>
                    <Form.Item name="weightGram" label="Khối lượng (gram)">
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={10}
                            placeholder="300"
                        />
                    </Form.Item>
                    <Form.Item name="isDefault" label="Biến thể mặc định" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    {product.media && product.media.length > 0 && (
                        <div className="mt-4">
                            <div className="mb-2 text-sm font-medium text-slate-700">
                                Chọn ảnh từ thư viện sản phẩm
                            </div>
                            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-auto border border-slate-100 rounded-lg p-2">
                                {product.media.map((m: ProductMedia, index: number) => {
                                    const selected = selectedMediaIndexes.includes(index);
                                    return (
                                        <button
                                            type="button"
                                            key={m.id}
                                            onClick={() => {
                                                setSelectedMediaIndexes((prev) =>
                                                    selected
                                                        ? prev.filter((i) => i !== index)
                                                        : [...prev, index],
                                                );
                                            }}
                                            className={`relative border rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                                selected
                                                    ? 'border-violet-500 ring-1 ring-violet-400'
                                                    : 'border-slate-200'
                                            }`}
                                        >
                                            <img
                                                src={m.url}
                                                alt="media"
                                                className="w-full h-16 object-cover"
                                            />
                                            {m.isThumbnail && (
                                                <span className="absolute top-1 left-1 bg-black/60 text-[10px] text-white px-1 rounded">
                                                    THUMB
                                                </span>
                                            )}
                                            {selected && (
                                                <span className="absolute top-1 right-1 bg-violet-600 text-[10px] text-white px-1 rounded-full">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Form>
            </Modal>
        </div>
    );
}


