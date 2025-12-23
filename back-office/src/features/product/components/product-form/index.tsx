import { useState, useMemo } from 'react';
import {
    Form,
    Input,
    Switch,
    Upload,
    Button,
    Space,
    Image,
    Select,
    InputNumber,
    Collapse,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import type { Product, Category } from '@shared';
import type { CreateProductDTO } from '../../services/create-product';
import { useCategories } from '@/features/category';

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

const { TextArea } = Input;

type ProductFormData = CreateProductDTO;

interface ProductFormProps {
    initialValues?: Partial<Product> & { categories?: Array<{ categoryId: string }> };
    onSubmit: (values: {
        data: ProductFormData;
        images: File[];
    }) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

export function ProductForm({
    initialValues,
    onSubmit,
    onCancel,
    loading = false,
}: ProductFormProps) {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');

    // Load categories
    const { data: categories } = useCategories(true);

    // Flatten categories for selection
    const flatCategories = useMemo(() => {
        if (!categories) return [];
        const flatten = (cats: Category[], result: Category[] = []): Category[] => {
            cats.forEach((cat) => {
                result.push(cat);
                if (cat.children && cat.children.length > 0) {
                    flatten(cat.children, result);
                }
            });
            return result;
        };
        return flatten(categories);
    }, [categories]);

    // Convert initial media URLs to UploadFile format
    const initialMediaFiles: UploadFile[] =
        initialValues?.media?.map((media, index) => ({
            uid: media.id,
            name: `image-${index + 1}.jpg`,
            status: 'done',
            url: media.url,
            thumbUrl: media.url,
        })) || [];

    const [existingMedia, setExistingMedia] = useState(initialMediaFiles);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const newFiles = fileList
                .filter((file) => file.originFileObj)
                .map((file) => file.originFileObj as File);

            const isEdit = !!initialValues;

            const payload: ProductFormData = {
                name: {
                    vi: values.nameVi,
                    ...(values.nameEn ? { en: values.nameEn } : {}),
                },
                description: values.descriptionVi || values.descriptionEn
                    ? {
                        vi: values.descriptionVi,
                        ...(values.descriptionEn ? { en: values.descriptionEn } : {}),
                    }
                    : undefined,
                slug: values.slug || undefined,
                categoryIds: values.categoryIds && values.categoryIds.length > 0 ? values.categoryIds : undefined,
                // Tạm thời coi tất cả là sản phẩm đơn (không biến thể)
                hasVariants: false,
                basePrice: values.basePrice,
                baseCompareAtPrice: values.baseCompareAtPrice,
                baseCostPrice: values.baseCostPrice,
                baseWeightGram: values.baseWeightGram,
                // Tạo mới: luôn ở trạng thái nháp (isActive = false) để tránh "sản phẩm ma"
                // Chỉ cho phép bật isActive ở bước chỉnh sửa sau khi đã thêm variant.
                isActive: isEdit ? (values.isActive ?? true) : false,
                isFeatured: values.isFeatured ?? false,
            };

            await onSubmit({
                data: payload,
                images: newFiles,
            });
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    const handlePreview = (file: UploadFile) => {
        if (file.url || file.preview) {
            setPreviewImage(file.url || file.preview || '');
            setPreviewVisible(true);
        }
    };

    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const handleRemoveExisting = (uid: string) => {
        setExistingMedia((prev) => prev.filter((file) => file.uid !== uid));
    };

    const uploadButton = (
        <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>
    );

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{
                nameVi: initialValues?.name ? (initialValues.name as Record<string, string>).vi : '',
                nameEn: initialValues?.name ? (initialValues.name as Record<string, string>).en : '',
                descriptionVi: initialValues?.description
                    ? (initialValues.description as Record<string, string>).vi
                    : '',
                descriptionEn: initialValues?.description
                    ? (initialValues.description as Record<string, string>).en
                    : '',
                slug: initialValues?.slug || '',
                categoryIds:
                    initialValues?.categories?.map((c: { categoryId: string }) => c.categoryId) || [],
                // Tạo mới: luôn là false (draft) cho an toàn
                isActive: initialValues?.isActive ?? false,
                isFeatured: initialValues?.isFeatured ?? false,
            }}
        >
            <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Form.Item
                            name="nameVi"
                            label="Tên sản phẩm (Tiếng Việt)"
                            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                        >
                            <Input placeholder="Ví dụ: Áo thun nam" />
                        </Form.Item>
                    </div>
                    <Form.Item name="categoryIds" label="Danh mục">
                        <Select
                            mode="multiple"
                            placeholder="Chọn danh mục"
                            showSearch
                            filterOption={(input, option) => {
                                const label = typeof option?.label === 'string' ? option.label : String(option?.label || '');
                                return label.toLowerCase().includes(input.toLowerCase());
                            }}
                            options={flatCategories.map((cat: Category) => ({
                                value: cat.id,
                                label: getDisplayName(cat.name),
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="basePrice"
                        label="Giá bán"
                        rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={1000}
                            placeholder="Ví dụ: 199000"
                        />
                    </Form.Item>
                </div>

                {/* Ảnh sản phẩm */}
                <div className="space-y-3">
                    {existingMedia.length > 0 && (
                        <Form.Item label="Ảnh hiện tại">
                            <div className="flex flex-wrap gap-2">
                                {existingMedia.map((file) => (
                                    <div key={file.uid} className="relative">
                                        <Image
                                            src={file.url}
                                            alt={file.name}
                                            width={90}
                                            height={90}
                                            className="object-cover rounded"
                                        />
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            size="small"
                                            className="absolute top-0 right-0"
                                            onClick={() => handleRemoveExisting(file.uid)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Ảnh sản phẩm"
                        extra="Có thể upload nhiều ảnh cùng lúc (tối đa 10 ảnh, mỗi ảnh tối đa 5MB)"
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleChange}
                            onPreview={handlePreview}
                            beforeUpload={() => false}
                            accept="image/*"
                            multiple
                            maxCount={10}
                        >
                            {fileList.length >= 10 ? null : uploadButton}
                        </Upload>
                    </Form.Item>
                </div>

                {previewVisible && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                        onClick={() => setPreviewVisible(false)}
                    >
                        <div className="max-w-4xl max-h-full p-4">
                            <Image src={previewImage} alt="Preview" className="max-w-full max-h-full" />
                        </div>
                    </div>
                )}

                {/* Trạng thái */}
                <div className="grid gap-4 md:grid-cols-2">
                    {initialValues && (
                        <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    )}
                    <Form.Item name="isFeatured" label="Nổi bật" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </div>

                {/* Thông tin bổ sung (ẩn bớt cho gọn) */}
                <Collapse size="small" defaultActiveKey={[]}>
                    <Collapse.Panel header="Thông tin bổ sung" key="advanced">
                        <div className="space-y-4">
                            <Form.Item name="nameEn" label="Tên sản phẩm (English)">
                                <Input placeholder="Optional: Men T-Shirt" />
                            </Form.Item>

                            <Form.Item
                                name="slug"
                                label="Slug"
                                extra="Nếu để trống sẽ tự động tạo từ tên"
                                rules={[
                                    {
                                        pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                                        message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
                                    },
                                ]}
                            >
                                <Input placeholder="ao-thun-nam" />
                            </Form.Item>

                            <Form.Item name="descriptionVi" label="Mô tả (Tiếng Việt)">
                                <TextArea rows={3} placeholder="Mô tả sản phẩm..." />
                            </Form.Item>

                            <Form.Item name="descriptionEn" label="Mô tả (English)">
                                <TextArea rows={3} placeholder="Product description..." />
                            </Form.Item>

                            <div className="grid gap-4 md:grid-cols-3">
                                <Form.Item name="baseCompareAtPrice" label="Giá gốc (nếu có)">
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        step={1000}
                                        placeholder="249000"
                                    />
                                </Form.Item>

                                <Form.Item name="baseCostPrice" label="Giá vốn (nếu có)">
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        step={1000}
                                        placeholder="120000"
                                    />
                                </Form.Item>

                                <Form.Item name="baseWeightGram" label="Khối lượng (gram)">
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        step={10}
                                        placeholder="300"
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    </Collapse.Panel>
                </Collapse>

                <Form.Item>
                    <Space>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>
                            {initialValues ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                        {onCancel && (
                            <Button onClick={onCancel} disabled={loading}>
                                Hủy
                            </Button>
                        )}
                    </Space>
                </Form.Item>
            </div>
        </Form>
    );
}
