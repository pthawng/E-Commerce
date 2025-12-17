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
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import type { Product, Category } from '@shared';
import { useCategories } from '@/features/category';

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

const { TextArea } = Input;

interface ProductFormData extends Partial<Product> {
    categoryIds?: string[];
}

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

            await onSubmit({
                data: {
                    name: {
                        vi: values.nameVi,
                        ...(values.nameEn ? { en: values.nameEn } : {}),
                    },
                    description: values.description
                        ? {
                            vi: values.descriptionVi,
                            ...(values.descriptionEn ? { en: values.descriptionEn } : {}),
                        }
                        : undefined,
                    slug: values.slug || undefined,
                    categoryIds: values.categoryIds && values.categoryIds.length > 0 ? values.categoryIds : undefined,
                    hasVariants: values.hasVariants ?? true,
                    isActive: values.isActive ?? true,
                    isFeatured: values.isFeatured ?? false,
                },
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
                hasVariants: initialValues?.hasVariants ?? true,
                isActive: initialValues?.isActive ?? true,
                isFeatured: initialValues?.isFeatured ?? false,
            }}
        >
            <Form.Item
                name="nameVi"
                label="Tên sản phẩm (Tiếng Việt)"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
            >
                <Input placeholder="Ví dụ: Áo thun nam" />
            </Form.Item>

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
                <TextArea rows={4} placeholder="Mô tả sản phẩm..." />
            </Form.Item>

            <Form.Item name="descriptionEn" label="Mô tả (English)">
                <TextArea rows={4} placeholder="Product description..." />
            </Form.Item>

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

            {existingMedia.length > 0 && (
                <Form.Item label="Ảnh hiện tại">
                    <div className="flex flex-wrap gap-2">
                        {existingMedia.map((file) => (
                            <div key={file.uid} className="relative">
                                <Image
                                    src={file.url}
                                    alt={file.name}
                                    width={100}
                                    height={100}
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
                label="Upload ảnh mới"
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

            <Form.Item name="hasVariants" label="Có biến thể" valuePropName="checked">
                <Switch />
            </Form.Item>

            <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
                <Switch />
            </Form.Item>

            <Form.Item name="isFeatured" label="Nổi bật" valuePropName="checked">
                <Switch />
            </Form.Item>

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
        </Form>
    );
}
