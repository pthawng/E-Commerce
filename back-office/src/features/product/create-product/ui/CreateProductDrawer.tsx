import React, { useState } from 'react';
import {
    Drawer,
    Button,
    Form,
    Input,
    Switch,
    InputNumber,
    Row,
    Col,
    Card,
    Typography,
    Space,
    Upload,
    message,
    Divider,
    Select,
    TreeSelect,
} from 'antd';
import {
    PlusOutlined,
    UploadOutlined,
    DeleteOutlined,
    SettingOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateProductSchema, CreateProductFormValues } from '../model/productSchema';
import { productApi } from '@/entities/product/api/productApi';
import { categoryApi, CategoryTreeNode } from '@/entities/category/api/categoryApi';
import { attributeApi } from '@/entities/attribute/api/attributeApi';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface CreateProductDrawerProps {
    open: boolean;
    onClose: () => void;
}

export const CreateProductDrawer: React.FC<CreateProductDrawerProps> = ({ open, onClose }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);

    const { data: categories } = useQuery({
        queryKey: ['categories-tree'],
        queryFn: () => categoryApi.getTree(false),
    });

    const { data: attributes } = useQuery({
        queryKey: ['attributes'],
        queryFn: () => attributeApi.getAll(),
    });

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm<CreateProductFormValues>({
        resolver: zodResolver(CreateProductSchema),
        defaultValues: {
            name: { vi: '', en: '' },
            description: { vi: '', en: '' },
            hasVariants: true,
            isActive: true,
            isFeatured: false,
            variants: [],
            categoryIds: [],
        },
    });

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: 'variants',
    });

    const hasVariants = watch('hasVariants');

    const formatCategoryTree = (nodes: CategoryTreeNode[]): any[] => {
        return nodes.map(node => ({
            title: node.name.vi || node.name.en,
            value: node.id,
            children: node.children ? formatCategoryTree(node.children) : [],
        }));
    };

    const handleClose = () => {
        reset();
        setFileList([]);
        onClose();
    };

    const onSubmit = async (data: CreateProductFormValues) => {
        try {
            setSubmitting(true);
            const formData = new FormData();

            formData.append('name', JSON.stringify(data.name));
            if (data.slug) formData.append('slug', data.slug);
            if (data.description) formData.append('description', JSON.stringify(data.description));
            formData.append('hasVariants', String(data.hasVariants));
            formData.append('isActive', String(data.isActive));
            formData.append('isFeatured', String(data.isFeatured));

            if (data.categoryIds?.length) {
                data.categoryIds.forEach(id => formData.append('categoryIds', id));
            }

            if (data.hasVariants && data.variants) {
                formData.append('variants', JSON.stringify(data.variants));
            } else {
                if (data.basePrice) formData.append('basePrice', String(data.basePrice));
                if (data.baseCompareAtPrice) formData.append('baseCompareAtPrice', String(data.baseCompareAtPrice));
                if (data.baseCostPrice) formData.append('baseCostPrice', String(data.baseCostPrice));
                if (data.baseWeightGram) formData.append('baseWeightGram', String(data.baseWeightGram));
                if (data.baseAttributeValueIds?.length) {
                    data.baseAttributeValueIds.forEach(id => formData.append('baseAttributeValueIds', id));
                }
            }

            fileList.forEach(file => {
                formData.append('images', file.originFileObj as File);
            });

            await productApi.createProduct(formData);

            message.success(t('products.create_success', 'Tạo sản phẩm thành công!'));
            queryClient.invalidateQueries({ queryKey: ['pim-products'] });
            handleClose();
        } catch (error: any) {
            message.error(error.response?.data?.message || t('common.error_boundary_title'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Drawer
            title={
                <Title level={4} className="!m-0 font-serif uppercase tracking-widest">
                    {t('products.catalog.create', 'TẠO KIỆT TÁC MỚI')}
                </Title>
            }
            width="100%"
            open={open}
            onClose={handleClose}
            className="luxury-drawer"
            extra={
                <Space>
                    <Button onClick={handleClose} disabled={submitting}>
                        {t('common.cancel', 'HỦY')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleSubmit(onSubmit)}
                        loading={submitting}
                        className="bg-black border-none uppercase tracking-widest font-bold"
                    >
                        {t('common.save', 'LƯU KIỆT TÁC')}
                    </Button>
                </Space>
            }
        >
            <Form layout="vertical" className="max-w-7xl mx-auto py-6">
                <Row gutter={32}>
                    <Col span={16} className="space-y-6">
                        <Card
                            title={
                                <Space>
                                    <SettingOutlined /> Thông tin cơ bản
                                </Space>
                            }
                            className="rounded-none border-gray-200 shadow-sm"
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Tên sản phẩm (VI)"
                                        validateStatus={errors.name?.vi ? 'error' : ''}
                                        help={errors.name?.vi?.message}
                                        required
                                    >
                                        <Controller
                                            name="name.vi"
                                            control={control}
                                            render={({ field }) => <Input {...field} placeholder="VD: Nhẫn Kim Cương" />}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Product Name (EN)"
                                        validateStatus={errors.name?.en ? 'error' : ''}
                                        help={errors.name?.en?.message}
                                        required
                                    >
                                        <Controller
                                            name="name.en"
                                            control={control}
                                            render={({ field }) => <Input {...field} placeholder="Ex: Diamond Ring" />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item
                                label="Slug (Tùy chọn)"
                                validateStatus={errors.slug ? 'error' : ''}
                                help={errors.slug?.message}
                            >
                                <Controller
                                    name="slug"
                                    control={control}
                                    render={({ field }) => <Input {...field} placeholder="Tuỳ chọn. Sẽ tự sinh nếu để trống." />}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Mô tả (VI)">
                                        <Controller
                                            name="description.vi"
                                            control={control}
                                            render={({ field }) => <Input.TextArea {...field} rows={4} />}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Description (EN)">
                                        <Controller
                                            name="description.en"
                                            control={control}
                                            render={({ field }) => <Input.TextArea {...field} rows={4} />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        <Card title="Hình ảnh & Đa phương tiện" className="rounded-none border-gray-200 shadow-sm">
                            <Dragger
                                multiple
                                fileList={fileList}
                                beforeUpload={file => {
                                    const isValidType =
                                        file.type === 'image/jpeg' ||
                                        file.type === 'image/png' ||
                                        file.type === 'image/webp';
                                    if (!isValidType) {
                                        message.error(`${file.name} không đúng định dạng (chỉ hỗ trợ JPG, PNG, WEBP)`);
                                        return Upload.LIST_IGNORE;
                                    }
                                    const isLt5M = file.size / 1024 / 1024 < 5;
                                    if (!isLt5M) {
                                        message.error(`${file.name} vượt quá dung lượng 5MB`);
                                        return Upload.LIST_IGNORE;
                                    }
                                    return false;
                                }}
                                onChange={info => {
                                    const validFiles = info.fileList.filter(
                                        f => f.status !== 'error' && f.originFileObj
                                    );
                                    setFileList(validFiles);
                                }}
                                onRemove={file => setFileList(prev => prev.filter(f => f.uid !== file.uid))}
                                listType="picture"
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Kéo thả file hoặc Click để chọn (Tối đa 10 ảnh)</p>
                                <p className="ant-upload-hint">
                                    Hỗ trợ JPG, PNG, WEBP. Ảnh đầu tiên sẽ là Thumbnail mặc định.
                                </p>
                            </Dragger>
                        </Card>

                        <Card
                            title={
                                <div className="flex justify-between items-center">
                                    <span>Biến thể (Variants)</span>
                                    <Controller
                                        name="hasVariants"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onChange={field.onChange}
                                                checkedChildren="Có"
                                                unCheckedChildren="Không"
                                            />
                                        )}
                                    />
                                </div>
                            }
                            className="rounded-none border-gray-200 shadow-sm"
                        >
                            {hasVariants ? (
                                <div className="space-y-4">
                                    {errors.variants?.root && (
                                        <Text type="danger">{errors.variants.root.message}</Text>
                                    )}
                                    {variantFields.map((field, index) => (
                                        <Card
                                            key={field.id}
                                            size="small"
                                            type="inner"
                                            title={`Biến thể #${index + 1}`}
                                            extra={
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => removeVariant(index)}
                                                />
                                            }
                                        >
                                            <Row gutter={16}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label="SKU"
                                                        validateStatus={errors.variants?.[index]?.sku ? 'error' : ''}
                                                    >
                                                        <Controller
                                                            name={`variants.${index}.sku`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Input {...field} placeholder="Auto-gen nếu trống" />
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label="Giá bán (Bắt buộc)"
                                                        required
                                                        validateStatus={errors.variants?.[index]?.price ? 'error' : ''}
                                                    >
                                                        <Controller
                                                            name={`variants.${index}.price`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <InputNumber
                                                                    {...field}
                                                                    className="w-full"
                                                                    min={1}
                                                                    formatter={v =>
                                                                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                                    }
                                                                />
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label="Giá gốc (Compare At)">
                                                        <Controller
                                                            name={`variants.${index}.compareAtPrice`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <InputNumber {...field} className="w-full" min={0} />
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={16}>
                                                <Col span={24}>
                                                    <Form.Item label="Thuộc tính (Attributes)">
                                                        <Controller
                                                            name={`variants.${index}.attributeValueIds`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select
                                                                    {...field}
                                                                    mode="multiple"
                                                                    placeholder="Chọn thuộc tính cho biến thể này"
                                                                    className="w-full"
                                                                    options={
                                                                        attributes?.map(attr => ({
                                                                            label: attr.name?.vi || attr.name?.en,
                                                                            options: attr.values.map(v => ({
                                                                                label: v.value?.vi || v.value?.en,
                                                                                value: v.id,
                                                                            })),
                                                                        })) || []
                                                                    }
                                                                />
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={16}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label="Giá vốn (Cost)"
                                                        validateStatus={
                                                            errors.variants?.[index]?.costPrice ? 'error' : ''
                                                        }
                                                    >
                                                        <Controller
                                                            name={`variants.${index}.costPrice`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <InputNumber {...field} className="w-full" min={0} />
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label="Khối lượng (gram)">
                                                        <Controller
                                                            name={`variants.${index}.weightGram`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <InputNumber {...field} className="w-full" min={0} />
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Card>
                                    ))}
                                    <Button
                                        type="dashed"
                                        block
                                        icon={<PlusOutlined />}
                                        onClick={() =>
                                            appendVariant({
                                                price: 0,
                                                isActive: true,
                                                isDefault: variantFields.length === 0,
                                            })
                                        }
                                    >
                                        Thêm biến thể mới
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item
                                                label="Giá bán (Bắt buộc)"
                                                required
                                                validateStatus={errors.basePrice ? 'error' : ''}
                                                help={errors.basePrice?.message}
                                            >
                                                <Controller
                                                    name="basePrice"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <InputNumber
                                                            {...field}
                                                            className="w-full"
                                                            min={1}
                                                            formatter={v =>
                                                                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="Giá gốc (Compare At)">
                                                <Controller
                                                    name="baseCompareAtPrice"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <InputNumber {...field} className="w-full" min={0} />
                                                    )}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                label="Giá vốn (Cost)"
                                                validateStatus={errors.baseCostPrice ? 'error' : ''}
                                                help={errors.baseCostPrice?.message}
                                            >
                                                <Controller
                                                    name="baseCostPrice"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <InputNumber {...field} className="w-full" min={0} />
                                                    )}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={24}>
                                            <Form.Item label="Thuộc tính (Dành cho sản phẩm đơn giản)">
                                                <Controller
                                                    name="baseAttributeValueIds"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            {...field}
                                                            mode="multiple"
                                                            placeholder="Chọn thuộc tính cho sản phẩm (Vật liệu, Kích thước, v.v...)"
                                                            className="w-full"
                                                            options={
                                                                attributes?.map(attr => ({
                                                                    label: attr.name?.vi || attr.name?.en,
                                                                    options: attr.values.map(v => ({
                                                                        label: v.value?.vi || v.value?.en,
                                                                        value: v.id,
                                                                    })),
                                                                })) || []
                                                            }
                                                        />
                                                    )}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </Card>
                    </Col>

                    <Col span={8} className="space-y-6">
                        <Card title="Phân loại & Trạng thái" className="rounded-none border-gray-200 shadow-sm">
                            <Form.Item label="Trạng thái hiển thị">
                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onChange={field.onChange}
                                            checkedChildren="Đang hoạt động"
                                            unCheckedChildren="Bản nháp"
                                        />
                                    )}
                                />
                            </Form.Item>
                            <Form.Item label="Sản phẩm Nổi bật (Featured)">
                                <Controller
                                    name="isFeatured"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onChange={field.onChange}
                                            checkedChildren="Có"
                                            unCheckedChildren="Không"
                                        />
                                    )}
                                />
                            </Form.Item>

                            <Divider />

                            <Form.Item label="Danh mục (Collection)">
                                <Controller
                                    name="categoryIds"
                                    control={control}
                                    render={({ field }) => (
                                        <TreeSelect
                                            {...field}
                                            treeData={categories ? formatCategoryTree(categories) : []}
                                            treeCheckable
                                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                            placeholder="Chọn bộ sưu tập"
                                            className="w-full"
                                            loading={!categories}
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Drawer>
    );
};
