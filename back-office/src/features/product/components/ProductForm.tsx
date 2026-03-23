import React, { useEffect } from 'react';
import {
    Form, Input, Select, Switch, InputNumber, Upload, Button,
    Row, Col, Card, Space, Divider, message,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCategoryTree } from '@/entities/category/model/queries';
import { useCreateProduct, useUpdateProduct } from '@/entities/product/model/mutations';
import { useProduct } from '@/entities/product/model/queries';
import type { CreateProductDTO } from '@/entities/product/model/schema';

const { Dragger } = Upload;

interface ProductFormProps {
    productId?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({ productId }) => {
    const isEditing = !!productId;
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [fileList, setFileList] = React.useState<UploadFile[]>([]);

    const { data: product } = useProduct(productId ?? '');
    const { data: categories } = useCategoryTree();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    // Flatten category tree to flat options
    const flatCategories = React.useMemo(() => {
        const flatten = (cats: any[], depth = 0): { label: string; value: string }[] =>
            (cats ?? []).flatMap((c) => [
                { label: `${'— '.repeat(depth)}${c.name?.vi ?? c.name?.en ?? c.slug}`, value: c.id },
                ...flatten(c.children, depth + 1),
            ]);
        return flatten(categories as any[]);
    }, [categories]);

    useEffect(() => {
        if (product && isEditing) {
            form.setFieldsValue({
                nameVi: product.name.vi ?? '',
                nameEn: product.name.en ?? '',
                slug: product.slug,
                descVi: product.description?.vi ?? '',
                descEn: product.description?.en ?? '',
                categoryIds: product.categoryId,
                hasVariants: product.hasVariants,
                isActive: product.isActive,
                isFeatured: product.isFeatured,
            });
        }
    }, [product, form, isEditing]);

    const onFinish = async (values: Record<string, unknown>) => {
        const dto: CreateProductDTO = {
            name: { vi: values.nameVi as string, en: values.nameEn as string },
            description: values.descVi || values.descEn ? { 
                vi: values.descVi as string || '', 
                en: values.descEn as string || '' 
            } : undefined,
            slug: (values.slug as string) || (values.nameEn as string).toLowerCase().replace(/\s+/g, '-'),
            categoryId: (values.categoryIds as string[])?.[0], // Single category
            hasVariants: values.hasVariants as boolean,
            isActive: values.isActive as boolean,
            isFeatured: values.isFeatured as boolean,
        };

        try {
            if (isEditing && productId) {
                await updateProduct.mutateAsync({ id: productId, data: dto });
                message.success('Product updated!');
            } else {
                await createProduct.mutateAsync(dto);
                message.success('Product created!');
            }
            navigate('/products');
        } catch {
            message.error('Failed to save product');
        }
    };

    const isPending = createProduct.isPending || updateProduct.isPending;

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={24}>
                {/* Left Column */}
                <Col xs={24} lg={16}>
                    <Card title="Basic Info" bordered={false} style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Name (Tiếng Việt)" name="nameVi" rules={[{ required: true }]}>
                                    <Input placeholder="Tên sản phẩm" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Name (English)" name="nameEn">
                                    <Input placeholder="Product name" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Slug" name="slug" extra="Leave empty to auto-generate from name">
                            <Input placeholder="product-slug" style={{ fontFamily: 'monospace' }} />
                        </Form.Item>
                        <Form.Item label="Description (vi)" name="descVi">
                            <Input.TextArea rows={3} placeholder="Mô tả tiếng Việt" />
                        </Form.Item>
                        <Form.Item label="Description (en)" name="descEn">
                            <Input.TextArea rows={3} placeholder="English description" />
                        </Form.Item>
                    </Card>

                    {/* Media Upload */}
                    <Card title="Images" bordered={false} style={{ marginBottom: 16 }}>
                        <Dragger
                            multiple
                            listType="picture"
                            fileList={fileList}
                            onChange={({ fileList: fl }) => setFileList(fl)}
                            beforeUpload={() => false}
                            accept="image/*"
                        >
                            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                            <p className="ant-upload-text">Click or drag to upload product images</p>
                            <p className="ant-upload-hint">Supports JPG, PNG, WebP — up to 10 files</p>
                        </Dragger>
                    </Card>

                    {/* Pricing (non-variant) */}
                    <Card title="Pricing (for non-variant products)" bordered={false}>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item label="Base Price (₫)" name="basePrice">
                                    <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Compare At (₫)" name="baseCompareAtPrice">
                                    <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Cost Price (₫)" name="baseCostPrice">
                                    <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Right Column */}
                <Col xs={24} lg={8}>
                    <Card title="Organization" bordered={false} style={{ marginBottom: 16 }}>
                        <Form.Item label="Category" name="categoryIds">
                            <Select
                                options={flatCategories}
                                placeholder="Select category"
                                allowClear
                            />
                        </Form.Item>
                    </Card>

                    <Card title="Settings" bordered={false}>
                        <Form.Item label="Has Variants" name="hasVariants" valuePropName="checked" initialValue={true}>
                            <Switch />
                        </Form.Item>
                        <Form.Item label="Active" name="isActive" valuePropName="checked" initialValue={true}>
                            <Switch />
                        </Form.Item>
                        <Form.Item label="Featured" name="isFeatured" valuePropName="checked" initialValue={false}>
                            <Switch />
                        </Form.Item>
                    </Card>
                </Col>
            </Row>

            <Divider />
            <Space>
                <Button type="primary" htmlType="submit" loading={isPending}>
                    {isEditing ? 'Save Changes' : 'Create Product'}
                </Button>
                <Button onClick={() => navigate('/products')}>Cancel</Button>
            </Space>
        </Form>
    );
};
